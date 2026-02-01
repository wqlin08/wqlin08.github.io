---
title: InSAR 处理(一)：ISCE2 (topsStack) 
date: 2026-01-08
categories: 
  - [遥感, SAR]
tags: 
  - ISCE2
  - Sentinel-1
  - SBAS
  - InSAR
cover: /img/blog/InSAR 处理(一)：ISCE2 (topsStack).png
---

> **摘要**：整合了一下使用 ISCE2 进行 InSAR 处理的标准流程。记录了从原始 SLC 数据到解缠相位的完整技术路线。

## 1. 安装基础环境

在 Ubuntu 系统下，InSAR 处理任务主要通过终端命令行完成。

建议使用 Conda 建立隔离环境。

```bash
# 1. 创建名为 insar 的虚拟环境 (指定 Python 3.9)
conda create -n insar python=3.9

# 2. 激活环境
conda activate insar

# 3. 安装核心软件
conda install -c conda-forge isce2 mintpy gdal

# 4. 验证安装
load_insar       # 加载 ISCE 环境变量
topsApp.py -h    # 测试 ISCE2
smallbaselineApp.py -h # 测试 MintPy
```
## 2. ISCE2 堆栈处理全流程

### 2.1. 账户注册

在ASFVertex 官网注册 Earthdata 账户：https://search.asf.alaska.edu/

### 2.2. 配置.netrc 凭证文件

```bash
# 1. 返回主目录打开.netrc 文件
cd ~

# 2. 进入 vi 后，按 i 键进入插入模式，输入以下内容：
machine urs.earthdata.nasa.gov
    login 你的用户名
    password 你的密码

# 3. 按 Esc 键，输入 :wq 并回车以保存并退出
conda install -c conda-forge isce2 mintpy gdal
```

### 2.3. 下载影像

- **数据集**：选择Sentinel-1。
- **File Type**：选择 SLC (Single Look Complex)。GRD不包含相位信息。
- **Beam Mode**：选择IW模式。
- **精密轨道文件**：下载轨道文件进行校正：https://s1qc.asf.alaska.edu/aux_poeorb/
- **DEM下载**：ISCE2 需要 DEM 来模拟并去除地形相位。（建议前往SRTM DEM官网手动下载。）

轨道文件可以使用以下代码下载（先在哥白尼中心注册账号）：
```python
import os
import glob
import subprocess
from datetime import datetime, timedelta

# 配置路径
data_dir = ""
orbit_dir = ""

# 1. 扫描 Data 目录下的所有 zip 文件
slc_files = glob.glob(os.path.join(data_dir, "S1*.zip"))
print(f"Found {len(slc_files)} SLC files in {data_dir}")

# 2. 提取唯一的日期
dates = set()
for f in slc_files:
    filename = os.path.basename(f)
    try:
        # Sentinel-1 标准命名格式: S1A_IW_SLC__1SDV_YYYYMMDDTHH...
        parts = filename.split('_')
        for part in parts:
            if part.startswith('20') and 'T' in part and len(part) >= 15:
                date_str = part.split('T')[0]
                dates.add(date_str)
                break
    except Exception as e:
        print(f"Skipping file {filename}: {e}")

sorted_dates = sorted(list(dates))
print(f"Unique dates to download: {len(sorted_dates)}")

# 3. 逐个日期调用 dloadOrbits.py
for d in sorted_dates:
    # 下载成像当天前后各1天的轨道 (覆盖精密轨道的26小时跨度)
    dt = datetime.strptime(d, "%Y%m%d")
    start_date = (dt - timedelta(days=1)).strftime("%Y%m%d")
    end_date = (dt + timedelta(days=2)).strftime("%Y%m%d")
    
    print(f"------------------------------------------------")
    print(f"Downloading orbit for SLC date: {d} (Query: {start_date} to {end_date})")
    
    # 构造命令
    cmd = f"dloadOrbits.py --start {start_date} --end {end_date} --dir {orbit_dir}"
    
    # 执行命令
    try:
        subprocess.run(cmd, shell=True, check=False)
    except Exception as e:
        print(f"Error downloading for {d}: {e}")

print("\nAll downloads attempted.")

```
DEM 下载：
```python
# 指定范围：南 北 西 东
dem.py -a stitch -b 26 32 86 93 -k -s 1 -c # 读取 dem 解压融合镶嵌为 isce 所需要的格式。
```

•	-a stitch: 执行拼接操作。

•	-b 26 32 86 93: 边界范围（Lat 26~32, Lon 86~93）。

•	-k: Keep，保留原始 .hgt 文件不删除（以防万一）。

•	-s 1: Source，指定数据源为 SRTM 1-arcsecond（30m）。

•	-c: 执行大地水准面校正 (Geoid Correction)。SRTM 原始数据是 EGM96 高程，ISCE 需要 WGS84 椭球高，这个参数会自动修正大约 -30m 到 -100m 的高程差


在处理大数据前，建议结构如下：

```bash
/Project_Home/
|-- slc/
# 存放下载的所有 .zip 原始影像
|-- orbits/
# 存放精密轨道文件 (.EOF)
|-- dem/
# 存放 dem.wgs84 及相关 .xml 文件
|-- aux/
# 存放 Sentinel-1 辅助校正文件
|-- processing/# ISCE 处理产生的中间文件夹
```
## 3. ISCE2 InSAR 时序处理全流程

- **ISCE2 (数据生产阶段)**：负责完成雷达坐标系下的重采样、配准、干涉图生成、滤波以及相位解缠。

### 3.1. stackSentinel.py 参数详解

```python
stackSentinel.py \
  -s SLC \
  -d DEM/demLat_N26_N32_Lon_E086_E093.dem.wgs84 \
  -b "29 29.8 88 89.9" \
  -a Aux \
  -o orbits \
  -C NESD \
  -W interferogram \
  -c 3 \

```

- **-s (SLC 目录)**: 存放原始.zip 压缩包的路径。脚本会自动解压并提取元数据。
- **-o (Orbits 目录)**: 存放 .EOF 精密轨道文件。ISCE2 会根据影像日期自动匹配最合适的轨道。
- **-d (DEM 文件)**: 必须使用WGS84投影的地理坐标系DEM。
- **-b (Bounding Box)**: 格式为 "S N W E"。建议范围略大于研究区，以确保包含足够的配准参考点。
- **-W**：设置为interferogram（干涉流）。
- **-c**：每个节点（影像日期）向后连接的邻居数量。
- **-C**: 配准模式
- **其他参数可以自己查看**

执行stackSentinel.py后会生成一个名为 run_files 的文件夹。

```python
cd configs

# 查看生成的 run 脚本数量
ls run_*

```
### 3.1. 执行
逐个运行16个文件即可。

例如：
```bash
bash run_01_unpack_topo_reference
```

### 3.2. 自动化执行

可以写一个脚本一次性执行全部任务。

```bash
for step in $(ls run_* | sort); do
    echo "=================================================="
    echo "正在启动: $step"
    echo "=================================================="
    ./$step
    # 检查退出状态码（$? 等于 0 代表执行成功）
    if [ $?-ne 0 ]; then
        echo "错误: $step 执行失败！流程已终止。"
        exit 1
    fi
done
echo "所有步骤已全部完成！"
```

## 4. 流程介绍

### Run 01-03：基础准备

- **Run 01-02**：解包 SLC 数据，建立统一的雷达坐标系参考网格。
- **Run 03**：计算垂直基线。

### Run 04-08：ESD 配准

由于 TOPS 模式在方位向存在多普勒中心频率的快速变化，微小的配准误差都会导致 Burst 拼接处出现明显的相位跳变。

- **Run 04-06**：专门针对 Burst 之间的重叠区进行提取和粗配准。
- **Run 07-08**：通过计算重叠区的双差相位，估算并反演每一景影像在方位向的刚性偏移量。

### Run 09-10：全幅面重采样

应用 Run 08 计算出的高精度偏移量，对整幅影像进行几何映射（geo2rdr）和重采样（resample）。

### Run 11-12：堆栈区域提取与 SLC 合并

- **Run 11**：计算所有影像的公共重叠范围，剔除无效边缘。  
- **Run 12**：生成全幅面的 SLC。

### Run 13-14：干涉图生成

- **Run 13**：在 Burst 层面生成干涉图。
- **Run 14**：将其无缝拼接。

### Run 15：自适应滤波

对干涉图进行 Goldstein 滤波，并生成 `filt_fine.cor`（相干性图）。

### Run 16：相位解缠（Unwrap）

调用 SNAPHU 进行解缠。

```bash
# 检查生成的文件
ls *.unw *.unw.conncomp
```

### 可视化检查

```python
# cd到具体的干涉对目录下
cd merged/interferograms/20200101_20200210/
# 1. 查看干涉图
mdx.py filt_fine.int
# 2. 查看解缠相位图
mdx.py filt_fine.unw
# 3. 查看相干性图
mdx.py filt_fine.cor
```