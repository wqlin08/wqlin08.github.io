var posts=["2026/01/09/工具箱/程序/自动排版软件/","2026/01/09/工具箱/代码/羽化镶嵌/","2026/01/08/遥感/SAR/InSAR-01-ISCE2-Workflow/","2026/01/09/工具箱/代码/mapborn/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };