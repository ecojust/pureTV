# 四款3D游戏资源名单测试修复

[CI43729918293](https://github.com/ecojust/pureTV/actions/runs/43729918293)、源码`59a2fa9b`中，四款游戏的`onlyBundledGameAssetsAreReadable`测试名单漏掉新加入的`puretv-controller.js`。生产宿主已有显式JavaScript路由，网页引用和打包资产均存在；失败差集仅此文件，未放宽资源访问边界。

修复只在四份测试的names/mimes数组补入该文件及`application/javascript`。原来的状态码200、MIME、精确资产字节、编码与非法路径断言保持，生产代码零改动。原4份XML、测试副本和[阶段静态核验](verification.json)保持原始结果。

后续`64f2c94e`/CI43730701526通过；当前正式旧游戏与观察器来源为`ed925cc1`，[CI43733343883](https://github.com/ecojust/pureTV/actions/runs/43733343883)的[384项JUnit全部通过](../../readme-controller-support/builds/ed925cc1/runs/43733343883/junit-summary.json)，含上述四项名单检查和新增44项Activity手柄集成用例。实际构建、lint、签名结果见[CI日志](../../readme-controller-support/builds/ed925cc1/runs/43733343883/workflow.log)及[产物核验](../../readme-controller-support/builds/ed925cc1/runs/43733343883/independent-artifact-verification.json)。这些结果不代表实体电视或ESP32已测试，也不取代另外进行的20包Android运行验收。
