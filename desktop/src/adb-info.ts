import {t} from './i18n';

interface CommandEntry {id:string;title:string;purpose:string;commands:string[];compatibility:string;kind:'read'|'write'|'local'}
interface CommandSection {id:string;title:string;items:CommandEntry[]}
const esc=(value:string):string=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const text=(value:string):string=>esc(t(value));

// Keep this reference aligned with core/manager.rs and core/launcher.rs.
const sections:CommandSection[] = [
  {
    "id": "connection",
    "title": "连接与授权",
    "items": [
      {
        "id": "connect",
        "title": "连接与重新连接",
        "purpose": "使用电视的调试地址连接，再检查设备是否在线且已授权。PORT 常见为 5555，以电视实际设置为准。",
        "commands": [
          "adb connect HOST:PORT",
          "adb devices -l"
        ],
        "compatibility": "兼容开启网络 ADB 的电视，包括允许此功能的 Android 4.4 固件。连接成功不等于已授权；unauthorized 时需在电视确认，offline 时需重新连接。",
        "kind": "local"
      },
      {
        "id": "disconnect",
        "title": "断开当前电视",
        "purpose": "仅断开当前选中的 SERIAL，不向其他电视发送断开命令。",
        "commands": [
          "adb disconnect SERIAL"
        ],
        "compatibility": "兼容电脑端 ADB 的网络连接。断开后清空当前设备信息和应用列表，不卸载电视应用。",
        "kind": "local"
      },
      {
        "id": "adb-tools",
        "title": "准备工具与清理进程",
        "purpose": "选择或下载 ADB 后通过 version 验证。每次连接前使用电脑的进程接口清理当前电脑用户的 ADB 进程；关闭管理器或交给更新助手前使用 kill-server。",
        "commands": [
          "adb version",
          "adb kill-server"
        ],
        "compatibility": "这些是电脑端操作，不依赖电视 Android 版本。连接前清理不是一条电视 shell 命令，也会中断其他 ADB 连接；未能确认并清理进程时不会继续连接。",
        "kind": "local"
      }
    ]
  },
  {
    "id": "identity",
    "title": "确认 Android 用户",
    "items": [
      {
        "id": "current-user",
        "title": "读取当前用户",
        "purpose": "依次尝试当前用户命令。若均不可用，读取 SDK；仅 SDK 19、21、22、23 使用已核实的旧版活动管理器输出，严格解析 mUserLru 列表的最后一项。U 必须来自实际查询。",
        "commands": [
          "adb -s SERIAL shell am get-current-user",
          "adb -s SERIAL shell cmd activity get-current-user",
          "adb -s SERIAL shell getprop ro.build.version.sdk",
          "adb -s SERIAL shell dumpsys activity processes"
        ],
        "compatibility": "原生 Android 4.4、5.0、5.1、6.0 不支持前两条用户命令，使用对应 SDK 的专用回退。其他系统不套用此列表规则；输出为空、非法或无法确认时停止应用操作，不默认使用用户 0。",
        "kind": "read"
      }
    ]
  },
  {
    "id": "system",
    "title": "电视系统信息",
    "items": [
      {
        "id": "properties",
        "title": "型号、系统版本与 CPU",
        "purpose": "读取型号、Android 版本，以及制造商、品牌、SDK、安全补丁和 CPU 属性。缺少新属性时尝试旧 CPU 属性；全局只读信息不依赖用户查询成功。",
        "commands": [
          "adb -s SERIAL shell getprop ro.product.model",
          "adb -s SERIAL shell getprop ro.build.version.release",
          "adb -s SERIAL shell getprop"
        ],
        "compatibility": "原生 Android 4.4 支持 getprop，但不一定提供安全补丁或新 CPU 属性。缺失字段显示未知，不由版本号推测。",
        "kind": "read"
      },
      {
        "id": "memory",
        "title": "内存与运行时间",
        "purpose": "从 proc 文件读取总内存、可用内存和运行秒数。没有 MemAvailable 时，使用 MemFree、Buffers 与 Cached 的合计。",
        "commands": [
          "adb -s SERIAL shell cat /proc/meminfo",
          "adb -s SERIAL shell cat /proc/uptime"
        ],
        "compatibility": "兼容旧系统的内存字段。厂商限制读取或输出不符合格式时显示未知；内存回退值是系统字段估算，不是应用可分配内存承诺。",
        "kind": "read"
      },
      {
        "id": "storage",
        "title": "数据分区容量",
        "purpose": "先按 KiB 查询 data 分区；失败或无法解析时改用不带参数的旧格式查询，识别带 K、M、G 单位的容量。",
        "commands": [
          "adb -s SERIAL shell df -k /data",
          "adb -s SERIAL shell df /data"
        ],
        "compatibility": "原生 Android 4.4 的 df 不支持 -k，使用第二条命令。旧格式容量已被系统舍入；无效单位、容量或非 data 分区结果不作为有效信息。",
        "kind": "read"
      },
      {
        "id": "resolution",
        "title": "画面分辨率",
        "purpose": "读取窗口管理器的分辨率；设备同时返回物理值和覆盖值时，以最后一个有效结果为准。",
        "commands": [
          "adb -s SERIAL shell wm size"
        ],
        "compatibility": "原生 Android 4.4 提供此命令。厂商固件可能限制访问，失败时显示未知；这里不会修改电视分辨率。",
        "kind": "read"
      }
    ]
  },
  {
    "id": "catalogue",
    "title": "应用列表与安装包大小",
    "items": [
      {
        "id": "packages",
        "title": "扫描与分类应用",
        "purpose": "第一条读取当前用户已安装包；后续分别查询系统包、停用包及仍被系统记录的包。带 -u 的结果包含已为用户卸载的包，不计为已安装。",
        "commands": [
          "adb -s SERIAL shell pm list packages --user U",
          "adb -s SERIAL shell pm list packages -s -u --user U",
          "adb -s SERIAL shell pm list packages -d --user U",
          "adb -s SERIAL shell pm list packages -u --user U"
        ],
        "compatibility": "原生 Android 4.4 支持这些列表参数。用户身份不可确认时不扫描其他用户；HOME 查询不可用时仍显示应用列表，但停用和卸载保持受限。",
        "kind": "read"
      },
      {
        "id": "apk-size",
        "title": "读取 APK 大小",
        "purpose": "先取得当前用户的 base 和 split APK 路径，再用 stat 汇总文件字节数。实际查询通过 sh 批处理，减少往返；不计应用私有数据和缓存。",
        "commands": [
          "adb -s SERIAL shell pm path --user U PACKAGE",
          "adb -s SERIAL shell stat -c %s -- APK_PATH"
        ],
        "compatibility": "原生 Android 4.4 不支持 pm path 的 --user 参数，也没有所需的 stat 工具。无法确认路径或大小时显示未知，仍可读取应用列表。",
        "kind": "read"
      }
    ]
  },
  {
    "id": "changes",
    "title": "启停、卸载与恢复",
    "items": [
      {
        "id": "disable",
        "title": "停用应用",
        "purpose": "先从 package dump 保存原启用状态，再对当前用户停用。每项操作前重新核对用户、应用状态和当前默认桌面，之后复查结果。",
        "commands": [
          "adb -s SERIAL shell dumpsys package PACKAGE",
          "adb -s SERIAL shell pm disable-user --user U PACKAGE"
        ],
        "compatibility": "原生 Android 4.4 有停用命令，但管理器无法通过其现代 HOME 接口确认默认桌面时，会停止停用。核心系统组件和当前默认桌面始终受保护。",
        "kind": "write"
      },
      {
        "id": "enable",
        "title": "启用与恢复原启用状态",
        "purpose": "通常使用 enable。若管理器保存的停用前状态为 DEFAULT，则使用 default-state 恢复系统默认行为，而不是强制设为显式启用。",
        "commands": [
          "adb -s SERIAL shell pm enable --user U PACKAGE",
          "adb -s SERIAL shell pm default-state --user U PACKAGE"
        ],
        "compatibility": "原生 Android 4.4 支持 enable 的 --user，但不支持 default-state。设备不支持所需命令时返回失败，不把执行失败描述为已恢复。",
        "kind": "write"
      },
      {
        "id": "uninstall",
        "title": "为当前用户卸载",
        "purpose": "使用 -k 保留包数据，使用 --user 限定已确认用户。系统分区中的 APK 不会因此删除；完成后重新读取应用列表确认状态。",
        "commands": [
          "adb -s SERIAL shell pm uninstall -k --user U PACKAGE"
        ],
        "compatibility": "原生 Android 4.4 的 uninstall 不支持 --user。管理器不会删除此参数降级为所有用户卸载；默认桌面无法确认时也会停止卸载。",
        "kind": "write"
      },
      {
        "id": "restore",
        "title": "恢复可恢复的系统应用",
        "purpose": "对设备仍保有 APK、但当前用户尚未安装的系统应用执行 install-existing，再复查是否已为该用户安装。此步骤不自动改变启用状态。",
        "commands": [
          "adb -s SERIAL shell cmd package install-existing --user U PACKAGE"
        ],
        "compatibility": "需要设备提供 cmd package install-existing；原生 Android 4.4 不提供此接口。APK 已从设备移除的应用无法通过此命令找回，需要重新取得安装包。",
        "kind": "write"
      }
    ]
  },
  {
    "id": "install",
    "title": "安装 APK",
    "items": [
      {
        "id": "install-apk",
        "title": "安装与覆盖升级",
        "purpose": "从待安装列表、启动器安装入口或市场下载并安装时，使用同一条安装命令。-r 表示覆盖升级，FILE.apk 是电脑上的单个 APK 路径；批量操作逐个执行。",
        "commands": [
          "adb -s SERIAL install --user U -r \"FILE.apk\""
        ],
        "compatibility": "原生 Android 4.4 的包管理安装命令不支持 --user，不能通过移除用户参数进行兼容降级。APK 本身还须满足最低 Android 版本、CPU 架构及覆盖安装签名要求；管理器可连接不代表所有市场 APK 均可安装。当前文件入口不安装 APKS 或 XAPK 分包容器。",
        "kind": "write"
      }
    ]
  },
  {
    "id": "launcher",
    "title": "启动器与布局",
    "items": [
      {
        "id": "home-query",
        "title": "查询启动器和默认桌面",
        "purpose": "查询提供 HOME 入口的组件，再解析当前用户的默认桌面。PACKAGE 是包名，COMPONENT 是包名与 Activity 类名组成的组件，不能互换。",
        "commands": [
          "adb -s SERIAL shell cmd package query-activities --components --user U -a android.intent.action.MAIN -c android.intent.category.HOME",
          "adb -s SERIAL shell cmd package resolve-activity --brief --user U -a android.intent.action.MAIN -c android.intent.category.HOME"
        ],
        "compatibility": "需要设备支持这些 cmd package 子命令；原生 Android 4.4 没有对应接口。仅有启动器 APK 并不代表管理器能安全识别或切换它。",
        "kind": "read"
      },
      {
        "id": "set-home",
        "title": "设置与恢复默认桌面",
        "purpose": "只接受已查询到的 HOME 组件。首次切换前保存原组件；恢复原桌面时执行同一命令并传入已保存组件。写入后重新解析默认桌面确认结果。",
        "commands": [
          "adb -s SERIAL shell cmd package set-home-activity --user U 'COMPONENT'"
        ],
        "compatibility": "原生 Android 4.4 不支持此接口。部分厂商固件会拒绝切换或在重启后恢复默认值；命令返回并不等于电视已采用新桌面。",
        "kind": "write"
      },
      {
        "id": "layout-read",
        "title": "读取布局、应用入口与背景",
        "purpose": "向兼容启动器的 provider 请求 status，读取布局、可启动应用和 Home 背景。URI 按启动器包名组成，背景预览也使用同一只读接口。",
        "commands": [
          "adb -s SERIAL shell content call --uri URI --user U --method status"
        ],
        "compatibility": "需要启动器实现 pureTV 布局接口且设备允许访问。Android 提供 content 命令不代表任意启动器支持；调整当前布局还要求能确认已安装、已启用的当前 HOME。",
        "kind": "read"
      },
      {
        "id": "layout-write",
        "title": "应用布局与恢复默认布局",
        "purpose": "应用时将经过校验的 JSON 编码为 UTF-8 Base64，作为 --arg 传入；reset 请求启动器恢复默认布局。两者写入前核对当前用户和 HOME，之后用 status 复查。",
        "commands": [
          "adb -s SERIAL shell content call --uri URI --user U --method apply --arg BASE64",
          "adb -s SERIAL shell content call --uri URI --user U --method reset"
        ],
        "compatibility": "只支持已验证的布局协议与 provider 响应，不改写未知启动器文件。Android 4.4 即使有 content call，也可能因 HOME 接口或启动器自身最低系统要求而无法使用布局功能。",
        "kind": "write"
      }
    ]
  },
  {
    "id": "local",
    "title": "无需电视 ADB 的操作",
    "items": [
      {
        "id": "local-actions",
        "title": "本机操作与资料浏览",
        "purpose": "本机 IP、文件选择和待安装列表、语言主题、读取或清空操作记录都在电脑处理。市场浏览和仅下载、论坛、包名用途资料及客户端更新检查通过网络访问资料源，不执行电视 shell。",
        "commands": [],
        "compatibility": "这些操作不要求电视在线。市场下载并安装在下载后仍调用上述 APK 安装命令；客户端更新安装的是电脑管理器，更新前会结束电脑 ADB 服务。",
        "kind": "local"
      },
      {
        "id": "local-layout",
        "title": "编辑、导入与导出布局草稿",
        "purpose": "已读取的布局可在电脑中调整名称、SVG、颜色、位置和背景，导入或导出 JSON。每次编辑草稿不会向电视写入；应用到电视或恢复默认布局才调用 provider 写接口。",
        "commands": [],
        "compatibility": "打开当前布局和显式刷新应用入口需要读取电视状态；本地草稿操作与最终应用分开。设备、用户或启动器改变时，需要重新读取并确认目标。",
        "kind": "local"
      }
    ]
  }
];
const labels = {
  "intro": "本页说明管理器实际使用的命令与回退方式，可离线阅读，不会执行命令。兼容性依据客户端实现与 Android 源码，厂商固件仍可能限制能力。",
  "heading": "命令用法与兼容性",
  "nav": "命令说明分组",
  "scroll": "ADB 命令与兼容性说明",
  "variables": "先替换命令中的参数",
  "variableHint": "下面的大写名称都是占位符，不是实际设备值；含空格的电脑路径需要加引号。管理器会自动填入并校验目标，本页仅用于解释。",
  "compat": "兼容性与限制",
  "read": "只读查询",
  "write": "修改电视",
  "local": "电脑端操作",
  "noCommand": "不执行电视 ADB 命令",
  "boundaries": "结果确认与取消",
  "verification": "界面与 MCP 共用核心执行逻辑。写入前重新确认设备和用户，写入后复查实际状态；退出码为 0 或收到返回值都不单独等于成功。批量取消会完成当前写入的结果核验，再跳过后续项目。",
  "kitkatTitle": "旧版 Android 的支持范围",
  "kitkat": "旧版 Android 4.4、5.0、5.1、6.0 使用专用当前用户查询回退，旧版 df 也有兼容读取。旧系统仍可能缺少 HOME 与部分用户限定修改命令；能连接不代表能安装、卸载或切换桌面。仓库启动器要求 Android 8 以上，其他 APK 需分别核对最低系统版本。品牌和固件的实机兼容性仍需逐项验证。"
};
const variables = [
  [
    "HOST:PORT / SERIAL",
    "电视的调试地址及已确认设备序列号。SERIAL 来自 adb devices -l，网络设备通常为 IP:PORT。"
  ],
  [
    "U",
    "实际读取的当前 Android 用户 ID，不是电脑用户名，也不固定为 0。"
  ],
  [
    "PACKAGE / COMPONENT",
    "应用包名，以及已查询到的 HOME 组件。COMPONENT 使用包名与 Activity 类名，中间用斜线分隔。"
  ],
  [
    "FILE.apk / APK_PATH",
    "电脑上的单个安装包路径，以及电视端查询得到的 APK 路径；两者不可互换。"
  ],
  [
    "URI / BASE64",
    "兼容启动器的 content://PACKAGE.layout 地址，以及合法布局 JSON 的 UTF-8 Base64 编码。"
  ]
];

export function adbInfoPage():string {
  const card=(entry:CommandEntry):string=>`<article class="info-command" data-info-operation="${entry.id}" aria-labelledby="info-operation-${entry.id}"><div class="info-command-heading"><h3 id="info-operation-${entry.id}">${text(entry.title)}</h3><span class="info-command-kind info-command-kind-${entry.kind}">${text(labels[entry.kind])}</span></div><p>${text(entry.purpose)}</p>${entry.commands.length?`<pre tabindex="0"><code>${esc(entry.commands.join('\n'))}</code></pre>`:`<p class="info-no-command">${text(labels.noCommand)}</p>`}<div class="info-compatibility"><h4>${text(labels.compat)}</h4><p>${text(entry.compatibility)}</p></div></article>`;
  return `<section class="panel adb-info info-panel" aria-label="${text(labels.scroll)}"><div class="info-toolbar"><h2>${text(labels.heading)}</h2><nav class="info-section-links" aria-label="${text(labels.nav)}">${sections.map(section=>`<a href="#info-${section.id}">${text(section.title)}</a>`).join('')}</nav></div><div class="info-scroll" data-scroll="info" tabindex="0" aria-label="${text(labels.scroll)}"><p class="info-intro">${text(labels.intro)}</p><aside class="info-kitkat"><h3>${text(labels.kitkatTitle)}</h3><p>${text(labels.kitkat)}</p></aside><section class="info-parameters" aria-labelledby="info-parameters-title"><h3 id="info-parameters-title">${text(labels.variables)}</h3><p>${text(labels.variableHint)}</p><dl>${variables.map(([name,description])=>`<div><dt><code>${esc(name)}</code></dt><dd>${text(description)}</dd></div>`).join('')}</dl></section>${sections.map(section=>`<section class="info-section" id="info-${section.id}" tabindex="-1" aria-labelledby="info-heading-${section.id}"><h2 id="info-heading-${section.id}">${text(section.title)}</h2><div class="info-command-grid">${section.items.map(card).join('')}</div></section>`).join('')}<section class="info-result-note"><h3>${text(labels.boundaries)}</h3><p>${text(labels.verification)}</p></section></div></section>`;
}
