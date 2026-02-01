---
title: InSAR 处理(二)：MintPy
date: 2026-01-08
categories: 
  - [遥感, SAR]
tags: 
  - ISCE2
  - Sentinel-1
  - SBAS
  - InSAR
cover: /img/blog/mintpy.png
---

> **摘要**：完成 ISCE2 之后，需要使用 MintPy 进行时序分析，步骤如下：

## 1. 构建配置文件(.txt)
以下为一个示例：
```bash
# vim: set filetype=cfg:
## ---------------- input data ---------------- ##
mintpy.load.processor        = isce

mintpy.load.metaFile         = ../reference/IW*.xml
mintpy.load.baselineDir      = ../baselines
## 数据加载路径配置
mintpy.load.unwFile          = ../merged/interferograms/*_*/filt_*.unw
mintpy.load.corFile          = ../merged/interferograms/*_*/filt_*.cor
mintpy.load.connCompFile         = ../merged/interferograms/*_*/filt_*.unw.conncomp
mintpy.load.demFile          = ../merged/geom_reference/hgt.rdr
mintpy.load.lookupYFile      = ../merged/geom_reference/lat.rdr
mintpy.load.lookupXFile      = ../merged/geom_reference/lon.rdr
mintpy.load.incAngleFile     = ../merged/geom_reference/los.rdr
mintpy.load.azAngleFile      = ../merged/geom_reference/los.rdr
mintpy.load.shadowMaskFile   = ../merged/geom_reference/shadowMask.rdr
mintpy.load.waterMaskFile    = ../merged/geom_reference/waterMask.rdr
mintpy.topographicResidual    = yes
## ---------------- network selection ---------------- ##
mintpy.network.coherenceBased  = yes
mintpy.network.minCoherence    = 0.3

## ---------------- tropospheric delay ---------------- ##
## 启用大气校正 (需安装 PyAPS)
mintpy.troposphericDelay.method       = pyaps
mintpy.troposphericDelay.weatherModel = ERA5
mintpy.troposphericDelay.weatherDir   = ./weather

## ---------------- geocoding ---------------- ##
mintpy.geocode              = yes
## 输出分辨率设置 (约 30m)
## 1度 ≈ 111km, 30m ≈ 30/111000 ≈ 0.00027
mintpy.geocode.laloStep     = 0.0002778
```
## 2.运行
直接一次性运行：

```bash
smallbaselineApp.py config.txt
```

或者逐个运行（逐个运行不会自动生成最后的可视化结果）：

1. 运行第一步：

```bash
smallbaselineApp.py config.txt --dostep load_data
```

运行结束后，查看 `inputs` 目录。应生成 `geometryRadar.h5` 和 `ifgramStack.h5`。

2. 运行：

```bash
plot_network.py inputs/ifgramStack.h5
```

观察干涉图的时空基线分布。

3. 运行第二步：

```bash
smallbaselineApp.py config.txt --dostep modify_network
```

4. 运行第三步：

```bash
smallbaselineApp.py config.txt --dostep reference_point
```

5. 运行第四步：

```bash
smallbaselineApp.py config.txt --dostep invert_network
```

由于配置了 `mintpy.troposphericDelay.method = pyaps`，程序将自动下载 ERA5 数据。确保当前运行环境已配置 `.cdsapirc` 文件（CDS API Key）。前往 https://cds.climate.copernicus.eu/ 注册账号，访问个人资料页面，找到 "API key" 区域，复制。前往：/home/用户名，然后在此创建 `.cdsapirc` 文件，将 `url` 和 `key` 粘贴于此。

```
url: https://cds.climate.copernicus.eu/api

key: 你的key
```

之后在环境中运行：

```bash
pip install cdsapi
```

必要：在首次下载数据前，必须在网页端同意 ERA5 的数据使用条款，否则 API 会报错。在 CDS 网站随便搜索下载一个数据，勾选 "Terms of use" 协议并接受即可。

6. 运行第五步：

```bash
smallbaselineApp.py config.txt --dostep correct_troposphere
```

Mintpy 会开始下载气象数据，可能会超时，但是会自动重试。例如：

```
Recovering from connection error [HTTPSConnectionPool(host='cds.climate.copernicus.eu', port=443): Max retries exceeded with url: /api/catalogue/v1/messages (Caused by ConnectTimeoutError(<urllib3.connection.HTTPSConnection object at 0x73aa34605ca0>, 'Connection to cds.climate.copernicus.eu timed out. (connect timeout=60)'))], attempt 1 of 500 Retrying in 120 seconds
```

7. 运行第六步：

```bash
smallbaselineApp.py config.txt --dostep correct_topography
```

8. 运行第七步：

```bash
smallbaselineApp.py config.txt --dostep velocity
```

9. 运行第八步：

```bash
smallbaselineApp.py config.txt --dostep geocode
```

10. 可选：

```bash
save_gdal.py geo/geo_velocity.h5 -o geo/velocity.tif
```
保存 tif 结果

