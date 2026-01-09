---
title: Mapborn：轻量级地理空间绘图工具库
date: 2026-01-09
categories: 
  - [工具箱, 程序]
tags: 
  - Python
  - 工具
cover: /img/blog/mapborn.jpg
---

# Mapborn 地理空间绘图工具库使用说明书

之前使用 matplotlab 画地图的时候，放置指北针和比例尺都比较麻烦，后来就做了这个工具包。

## 1. 概述

Mapborn 是一个基于 Python 的轻量级地理空间绘图工具库。集成了 Matplotlib 的绘图能力与 GDAL/OGR 的空间数据处理能力，旨在简化栅格数据与矢量数据的可视化流程。核心设计目标是提供一套简洁的编程接口，能够快速构建具备指北针、比例尺、经纬网格及色带等标准制图要素。该工具能够自动处理坐标系转换与投影匹配。

## 2. 环境依赖与安装

Mapborn 依赖于 Python 科学计算与地理信息处理的基础生态环境。在部署该工具前，运行环境需包含以下核心依赖库：

- GDAL: 用于处理多格式栅格与矢量数据，并提供底层坐标投影转换支持。
- Matplotlib: 提供底层绘图画布与图形渲染引擎。
- NumPy: 用于高性能矩阵运算与图像数据存储。

```bash
conda create -n mapborn python=3.10

conda activate mapborn

conda install -c conda-forge gdal matplotlib numpy
# 安装 mapborn
pip install "path\mapborn-0.1.0-py3-none-any.whl"
```

## 3. 核心类初始化

Map 类是本工具库的核心入口，负责管理绘图画布、加载基础数据以及调度各类制图组件。

```python
# 使用方法
from mapborn import Map
```

### 3.1 构造函数

- 类路径: `plot.Map`
- 调用方式: `Map(filepath, figsize=(10, 10), nodata=None)`

功能描述: 初始化地图对象。程序会根据 filepath 指向的文件类型自动判断加载模式。若文件为栅格数据，系统将其作为底图进行渲染；若文件为矢量数据，系统将其作为底图绘制轮廓。初始化过程会自动读取数据的空间参考系统（CRS）与地理范围。

参数详解:

- filepath: 目标空间数据的绝对路径或相对路径。支持 GDAL 兼容的栅格格式及 OGR 兼容的矢量格式。
- figsize: 定义输出画布的尺寸，格式为 (宽度, 高度)，单位为英寸。默认值为 (10, 10)。
- nodata (可选): 强制指定数据的无效值（NoData）。若该参数未指定，程序将尝试从源文件中自动读取无效值定义。

## 4. 基础绘图控制

### 4.1 设置标题

- 方法: `set_title(title, fontsize=16, fontfamily=None)`

功能描述: 为当前地图添加主标题。

参数详解:

- title: 标题文本内容。
- fontsize: 字体大小，默认值为 16。
- fontfamily (可选): 指定字体名称，如 Arial 或 SimHei 或 Times New Roman。

### 4.2 设置色带映射

- 方法: `set_cmap(cmap_name)`

功能描述: 更改栅格底图的颜色映射表。该方法仅在底图为栅格数据时生效。

参数详解:

- `cmap_name` Matplotlib 支持的标准色带名称。常用选项包括 viridis, plasma, terrain, gray, RdYlBu, Spectral 等。

### 4.3 设置数据范围

- 方法: `set_clim(vmin=None, vmax=None)`

功能描述: 控制栅格数据的渲染值域，用于调整图像对比度或统一多幅图的显示标准。

参数详解:

- vmin: 渲染色彩对应的最小值。
- vmax: 渲染色彩对应的最大值。

## 5. 地图整饰组件

Mapborn 提供了高度定制化的地图整饰要素，包括指北针、比例尺、经纬网格与色带。

### 5.1 指北针

- 方法: `add_north_arrow(location='top-right', style='nice', size=0.08, font_size=None, font_family=None)`

功能描述: 在地图上绘制指北针。程序支持多种预设样式，并允许灵活调整位置与大小。

参数详解:

- location (字符串或元组): 组件位置。  
  字符串模式支持 `top-right, top-left, bottom-right, bottom-left`。  
  元组模式支持 (x, y) 相对坐标，范围为 0.0 至 1.0。
- style (字符串): 指北针样式名称。  
  `nice`: 经典的黑白分体样式（默认）。  
  `simpleB`: 极简黑色实心箭头。  
  `simpleW`: 极简白色实心箭头。  
- size (浮点数): 指北针高度相对于画布高度的比例，默认值为 0.08。
- font_size (可选): “N” 标签的字体大小。
- font_family (可选): 标签字体名称。

### 5.2 比例尺

- 方法: `add_scale_bar(location='bottom-left', unit='km', style='blocks', font_size=None, font_family=None)`

功能描述: 根据底图的投影信息自动计算真实地理距离并绘制比例尺。程序能够识别投影坐标系与地理坐标系，并进行相应的距离换算。

参数详解:

- location (字符串或元组): 组件位置，定义方式同指北针。
- unit (字符串): 显示单位。  
  km: 千米（默认）。  
  m: 米。
- style (字符串): 比例尺样式。  
  `blocks`: 黑白交替方块样式（默认）。  
  `line-black`: 黑色线段样式。  
  `line-white`: 白色线段样式。
- font_size (可选): 刻度文本字体大小。

### 5.3 经纬网格

- 方法: `add_grid(style='default', interval=None, font_size=None, font_family=None, label_sides=['bottom', 'left'], label_rotation=0, padding=0.01)`

功能描述: 在地图上叠加经纬度网格线并标注坐标值。该组件利用 GeoTransformer 类将图面坐标实时转换为 WGS84 经纬度，确保在任意投影下网格的正确性。

参数详解:

- style (字符串): 网格线样式，目前支持 default。
- interval (可选): 网格线的经纬度间隔。若为 None，程序将根据视域范围自动计算合适的间隔。
- font_size (可选): 坐标标注的字体大小。
- label_sides (列表或字符串): 控制显示标注的方位。  
  列表模式: 如 `['bottom', 'left']`（默认）。  
  字符串模式: `all` 表示四周均显示。
- label_rotation (浮点数或字典): 标注文本的旋转角度。
- padding (浮点数): 标注文本距离图廓边缘的间距，以画布尺寸的百分比表示，默认值为 0.01。

### 5.4 色带

- 方法: `add_colorbar(location='right', width="5%", pad="2%", extend='neither', label="", label_size=12, tick_size=10, color='black', font_family='Arial')`

功能描述: 为栅格数据添加图例色带。该组件通过 `mpl_toolkits.axes_grid1` 实现与主图轴的自动对齐与分割。

参数详解:

- location (字符串): 色带位置，支持 `right, left, bottom, top`。
- width (字符串): 色带的宽度或高度，如 `"5%"`。
- pad (字符串): 色带与主图的间距，如 `"2%"`。
- extend (字符串): 色带两端的尖角样式，支持 `neither, both, min, max`。
- label (字符串): 色带的说明标签（如单位）。
- label_size (整数): 标签字体大小。
- tick_size (整数): 刻度数值字体大小。
- color (字符串): 色带边框、刻度及文本的颜色。
- font_family (字符串): 所有文本的字体样式。

## 6. 矢量叠加功能

除了基础底图外，工具库支持在地图上叠加额外的矢量图层。

### 6.1 添加矢量层

- 方法: `add_vector(filepath, **kwargs)`

功能描述: 读取外部矢量文件并将其叠加至当前地图。若矢量数据的坐标系与底图不一致，程序会自动构建坐标转换管道进行重投影。

参数详解:

- filepath (字符串): 矢量文件路径。
- kwargs: 传递给 Matplotlib 的标准绘图参数，用于控制矢量外观。  
  facecolor: 多边形填充颜色（如 none 表示透明）。  
  edgecolor: 边界线颜色。  
  linewidth: 线条宽度。  
  alpha: 图层透明度。

## 7. 输出与保存

完成地图绘制后，可通过以下方法进行预览或文件导出。

### 7.1 显示窗口

- 方法: `show()`

功能描述: 弹出交互式窗口显示当前绘制的地图。

### 7.2 保存文件

- 方法: `save(path, dpi=300)`

功能描述: 将地图保存为图像文件。程序会自动调整边界框以去除多余的留白。

参数详解:

- path (字符串): 输出文件的完整路径，包含文件名与后缀（如 result.png, map.pdf）。
- dpi (整数): 输出图像的分辨率，默认值为 300。

## 8. 帮助

使用`help(Map)`来查看详细信息。
```python
# 使用方法
from mapborn import Map

help(Map)
```

## 9. 源代码和 whl 文件

https://github.com/wqlin08/mapborn-Geographic-mapping-package