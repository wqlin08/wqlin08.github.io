var posts=["2026/01/09/工具箱/代码/羽化镶嵌/","2026/01/09/工具箱/程序/自动排版软件/","2026/01/09/工具箱/代码/mapborn/","2026/01/08/遥感/SAR/InSAR-02-MintPy-Workflow/","2026/02/01/工具箱/教程/跨网络远程开发环境搭建指南/","2026/01/08/遥感/SAR/InSAR-01-ISCE2-Workflow/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };