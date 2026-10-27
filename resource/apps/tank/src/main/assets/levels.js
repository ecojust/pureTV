/* 35 stage layouts adapted from hec9527/BattleCity (MIT, Copyright 2022 hec9527).
 * See ../../../licenses/hec9527-MIT.txt and ../../../docs/reference.md for provenance,
 * factual corrections, original rule references and implementation limits.
 * No ROM, executable disassembly, original music or graphics is embedded here.
 */
(function (root) {
  'use strict';
  const maps = [
    ["             ", " # # # # # # ", " # # # # # # ", " # # #@# # # ", " # # - - # # ", " - - _ _ - - ", "_ __ - - __ _", "^ -- _ _ -- ^", " _ _ ### _ _ ", " # # # # # # ", " # # - - # # ", " # #     # # ", "             "],
    ["   @   @     ", " # @   # # # ", " #    ## #@# ", "   #     @   ", "T  #  @  #T#@", "TT   #  @ T  ", " ###TTT@  T# ", "   @T# # # # ", "@# @ # #   # ", " # # ### #@# ", " # # ###     ", " #       # # ", " # #     ### "],
    ["    #   #    ", " TTT#     vvv", "#TTT         ", "TTTT   # ###[", "TTTT###- # ] ", "TTTT  #    ] ", " T    @@@  T ", " _ _     TTTT", "#[]#[]---TTTT", "     # __TTTT", "#  {   --TTT ", "## {     TTT ", "@##      #   "],
    [" TT        T ", "TT  _##__   T", "T  ]######_ ^", "^  ########[ ", "  ]-   -## [ ", "~ ] { { #[   ", "  # __  #[ ~~", "  ########   ", " ]########[  ", " --######--  ", " ##_-##-_## T", "T --    -- TT", "@T        TT@"],
    ["    ###      ", "v _ #   ^^@  ", "@ #   #      ", "# ### ## ~~ ~", "-   -    ~   ", "  _ ~~ ~~~ ##", "##  ~# #[    ", "    ~     }{ ", "~~~ ~ @ # }  ", "   __     }##", "    #---#_   ", "##-      -#  ", "-            "],
    ["     ] [TT   ", " [} [   ]T[]T", " [} [ # ]T[]T", " #  # @ #T #T", "   ]^ # -{ TT", "##[  T#T  ]##", "    ]TTT[    ", "@## -TTT-]##@", "^^^ _ T _ ^^^", " #  #   #    ", " #[  - -  ]#T", "  -       TTT", "  _       _TT"],
    ["       ^^    ", "  @^^^    @  ", "  @   T ^@@  ", " @   T@   @  ", "    T@@   ^@ ", " @ T@@@ @    ", " } @@   @@   ", "{   @ @@@  } ", " }@   @@T  @ ", " @    @T  @@ ", " ^^@  T  @   ", "         ^ v@", "vv           "],
    ["  #  # _ #   ", "T### # v #[  ", "TTT  - # - ][", "T~~~~~~~~~~ ~", " #    __     ", "  #  ]##-#-^^", "## # ]##T#vv#", "   @ v TTTT  ", "~~ ~~~~~ ~~~~", "TT ]  __     ", "TT# [  ] v_# ", "Tv# [    - # ", "         _ - "],
    ["   #     vT  ", "#     vT}@{ #", "   vT}@{ ^T  ", "  }@{ ^T     ", "   ^T        ", "   TvT TvT   ", "@# }@{ }@{ #@", "   T^T T^T   ", "    v   v    ", "#  }@{ }@{  #", "#  T^T T^T  #", "  _       _  ", "  ##     ##  "],
    ["             ", " ]-#      #-[", "]-  # TT #  ]", "#   #TTTT#  ]", "#  ]#T@@T#[ #", "]__#~~~~~~###", " ###@@#@@###[", "  ##@ # @##[ ", "  #########[ ", "#T---@@----T#", "#TTTTTTTTTTT#", "  TTT___TTTT ", "   [ # #  [  "],
    ["     @ # ##  ", " ]#### #     ", "   [ # ## TTT", " ]     @ TTTT", " ] ###@##TT-@", " ---@  # TT ]", "]### @TTTTT  ", "   @  TTTTT# ", "@# TTTT@TTT# ", "]#TTTTT    #[", " #TT    ^### ", "  TT     # ] ", " _TT         "],
    ["      ####   ", " ###_ _  #   ", "    # -    ##", " ~~~~~ #[  #^", "  vvv~ # @{# ", "# ###~~~ ~## ", "    @~   ~^  ", "~~~ ~~## ~   ", "     #^^ ~~~ ", "###          ", "  # ^^   ## ]", "#        #  #", "             "],
    ["    _   _    ", " ####   #### ", " #    #    @ ", " @ #-   -# ##", " # [Tv@vT] @#", " -  TTTTT  ^#", "#v  TTTTT  _#", "#@ [T^@^T] # ", "## #_   _# @ ", "#@    #    # ", "#####   ###@@", "##  -   -  # ", "##           "],
    ["             ", "TT  _###_  TT", "T  ]#####[  T", "   ##T#T##   ", "   #TT#TT#   ", "T  #######  T", "TT  #T#T#  TT", "~~~ ##### ~~~", "    ]]]]]    ", "    [[[[[    ", "}}}       {{{", "[[[       ]]]", "{{{}     {}}}"],
    ["    ##  #    ", " TT##   #    ", "TTTTTTTT##   ", "T^#T###TTTT#@", "TT#TTT^TT#{# ", " TT#vTTTT# # ", " #####TT##[TT", "}^##   #-   T", " # # v_-TT#[T", " #  ]#-TT#  T", " ##[]-TT_T#TT", "  # T   #T-T ", "  - T    TTT "],
    ["             ", "  @T@        ", "   T Tv      ", " T    T_     ", " TT  T Tv    ", " T T T  T_   ", " T  T   TTv  ", "  T    TTTT_ ", "   T  T TTTT ", "#     T  TTT@", "##     T TTTT", "@##     T TTT", "@@##    T  TT"],
    ["    _     _  ", " # ##  ***## ", " #  # @***** ", "***{#  #**** ", "******##][   ", "  }****#][ ^^", "####*******##", "   ##****{   ", " ### ***## # ", "***#*    # # ", "*****^ ^  _# ", "#****    #   ", "##{      # # "],
    ["        @@@T ", " #      @  @ ", "#T#   #### @ ", " #T#  # T#@@ ", "  # T@#T #   ", "    @ #@##   ", "  ##@# @     ", "  # T#@T     ", "@@@T #  ##   ", "@ ####  #@@  ", "@  @     @## ", "T@@@      #@@", "           @@"],
    [" # # # # # # ", " # # # # # # ", " ^ ^ ^ ^ ^ ^ ", "_ _ #   # _ _", "# #-# # #-# #", "^ ^ @ ^ @ ^ ^", "TT  # T #  TT", "TTTT#-T-#TTTT", "TTTTTTTTTTTTT", "_ _ #TTT# _ _", " # #  T  # # ", " # #     # # ", " - -     - - "],
    ["   ~ #  # #  ", "        # @  ", "   ~ _@ # #  ", "^ #~ @ _- #  ", "  #~   #     ", "# #~~ ~~~~  #", "   _   T ~ ^^", "##]# @TTT~ __", "- ]  #TTT~ # ", " v   # T ~ T ", " # v ---  TTT", " # #     ~TTT", "         ~ T "],
    ["   ___  _    ", " _########   ", " TTTTTTTT##  ", "TT      TT## ", "T @  @   TTT ", "T @  @   TTT ", "T  T    TT##[", "TTTTTTTTT###[", "#TT##TTT#### ", " ########## @", "@ #@######[ @", " @#-@#####@@@", "             "],
    ["     T       ", "    T@T      ", "  T  T  TT   ", " T#T   T##T  ", "  T#T   TT  T", "T  T  T    T@", "#T   T@T  T T", "@#T   T  T@T ", "#T  T   T T  ", "T  T#T T#T   ", "   T#T  T  T ", " T  T     T@T", "T@T      T#T "],
    ["             ", "     @@      ", "      @      ", " @@TT#@#TT@@ ", "   @TT@TT@   ", "T   @TTT@   T", "@T   TTT   T@", "T   v^T^v   T", "    @ v @    ", "   @  @  @   ", "             ", "             ", "  @       @  "],
    ["  @ #^    ]  ", "  # #T -###  ", " TT #T][   @@", "TTTTTT### ]# ", "  TT__^# ]#-]", "#^ _--   #- ]", "] _#*********", "] - *********", "  @ *********", "# # *********", "] # *********", "] #     *****", "  -      ****"],
    ["   @ # # # @ ", " # #     @   ", " # #  @  @ @@", " #   # @#   @", "    ## ## @  ", "  @ #  ## ## ", "@ @  # @  @# ", "  ## #   #@  ", " @## ## ##  #", " #   #@    ##", "   # ##@ @  #", "# ##     #@  ", "# #      ### "],
    ["  ~~         ", "v  ~T [      ", "Tv    { [ ~~ ", "TT ^_]  {T~  ", "TTT  @_]    v", "TT^v ] @_  vT", "T^  -@ ] ^ TT", "     [-@  TTT", "  ~T}  [-v^TT", " ~~ ] }     T", "      ] T~  ^", "@        ~~  ", "@@          @"],
    ["    @        ", "@@  @  @@    ", " @  @   @ @@T", " @  @@@ T @  ", " #    @ @@@  ", "T@@ @#@##    ", "  @T@T  #  @@", "  @  T  @  @ ", "  #  @  @@#@ ", "T@@@TT#@@ #@ ", "   #    TT # ", "   @     T # ", "   @     @ # "],
    ["          }{ ", "      v   @  ", "     _T_ #[  ", "    vTTTv#[  ", "   _TT*TT#[  ", "  vTT***TT[  ", " _TT*****TT_ ", "vTT*******TTv", "TT*********TT", " T*********T ", " T*********T ", " T***   ***T ", " T**     **T "],
    ["          #  ", " #~~ @ #     ", "  ~~#TTT~~ @ ", "     TTT~~#  ", " @  ~~ T     ", "TT# ~~@    # ", "TTT      @  @", " #~~ #       ", "@ ~~TT~~TT # ", "    T ~~TT~~ ", "   @T   TT~~ ", "  # #        ", "#        #@  "],
    ["             ", "     __   v  ", " vv _TTv _T_ ", "_TT_TTTT_TTT_", "TTTTTTTTTTTTT", "@T~TTTTT~TTTT", "TT~~~TTT~~~T@", "TTTT~T@TTT~TT", "TTTTTTTTTTTTT", "TTTTT--TTTTT^", "^TTT-  -TTT^ ", " ^--    ---  ", "             "],
    ["   ~    ~    ", "~~ ~ ~~~~ ~~~", "TT#  #  ~ ~T~", "T~~~~ @  #TTT", "TT ~  ~ ~~~~T", "~~ ~ ~~  ~   ", "  #T# #T ~  ~", " ~~T~~~~ T# ~", "#  #  ~ TT~ ~", "~~ ~~ ~#~~~  ", "  # TT  T~  ~", " ~~~T    ~ ~~", " ~           "],
    ["*************", "*************", "***#*****#***", "*# # #*# # #*", "*--#     #--*", "***#_#@#_#***", "@*** ^ ^ ***@", "**** _ _ ****", "**** # # ****", "***#  _  #***", "*#*# ^^^ #*#*", " #_#     #_# ", " -         - "],
    ["    @    @   ", " @   @  @TT  ", "  @    @Tv{  ", "   @ TTTTT } ", " {  @TT@T  @ ", " ^{T @TT@  } ", "  TTTTT  @   ", " v{T @T   @  ", " TTT@ @ v  @ ", "TTT@    }    ", "  @        }@", "         v{  ", "{ v          "],
    ["    []       ", "[[[] [  [[   ", "[[[##   [#[  ", "]] #[  ][##  ", " [ #][ [###  ", " []  #[#]]#  ", " [  ]##[ [#  ", " ]  [##[ [#  ", " ]-- ### [[-#", " ]  ][#][[[]]", "  [ #][##  ] ", "  [][   #[ [ ", "  []     ##  "],
    ["             ", "    # #      ", "T  T#T#T  T  ", "#TT#####TT#T ", "####@#@####T ", "~~~#####~~~T ", "~#########~~T", "###~###~###TT", "##~~~#~~~##~~", "T~~TTTTT~~T~T", " TT     TT T ", "             ", "             "]
  ];
  const groups = [
    [["basic", 18], ["fast", 2], ["power", 0], ["armor", 0]],
    [["armor", 2], ["fast", 4], ["power", 0], ["basic", 14]],
    [["basic", 14], ["fast", 4], ["power", 0], ["armor", 2]],
    [["power", 10], ["fast", 5], ["basic", 2], ["armor", 3]],
    [["power", 5], ["armor", 2], ["basic", 8], ["fast", 5]],
    [["power", 7], ["fast", 2], ["basic", 9], ["armor", 2]],
    [["basic", 3], ["fast", 4], ["power", 6], ["basic", 7]],
    [["power", 7], ["armor", 2], ["fast", 4], ["basic", 7]],
    [["basic", 6], ["fast", 4], ["power", 7], ["armor", 3]],
    [["basic", 12], ["fast", 2], ["power", 4], ["armor", 2]],
    [["fast", 5], ["armor", 6], ["power", 4], ["fast", 5]],
    [["power", 8], ["fast", 6], ["basic", 0], ["armor", 6]],
    [["power", 8], ["fast", 8], ["basic", 0], ["armor", 4]],
    [["power", 10], ["fast", 4], ["basic", 0], ["armor", 6]],
    [["basic", 2], ["power", 0], ["fast", 10], ["armor", 8]],
    [["basic", 16], ["power", 0], ["fast", 2], ["armor", 2]],
    [["armor", 2], ["fast", 2], ["power", 8], ["basic", 8]],
    [["armor", 4], ["basic", 2], ["power", 6], ["fast", 8]],
    [["fast", 4], ["armor", 8], ["basic", 4], ["power", 4]],
    [["fast", 8], ["basic", 2], ["power", 2], ["armor", 8]],
    [["power", 8], ["fast", 2], ["basic", 6], ["armor", 4]],
    [["fast", 8], ["basic", 6], ["power", 2], ["armor", 4]],
    [["armor", 6], ["basic", 0], ["power", 4], ["fast", 10]],
    [["power", 4], ["armor", 2], ["fast", 4], ["basic", 10]],
    [["power", 2], ["fast", 8], ["basic", 0], ["armor", 10]],
    [["fast", 6], ["armor", 6], ["basic", 4], ["power", 4]],
    [["power", 2], ["armor", 8], ["fast", 8], ["basic", 2]],
    [["fast", 2], ["armor", 1], ["basic", 15], ["power", 2]],
    [["power", 10], ["fast", 4], ["basic", 0], ["armor", 6]],
    [["basic", 4], ["fast", 8], ["power", 4], ["armor", 4]],
    [["power", 3], ["fast", 8], ["armor", 6], ["power", 3]],
    [["armor", 8], ["basic", 6], ["power", 2], ["fast", 4]],
    [["fast", 4], ["armor", 8], ["power", 4], ["fast", 4]],
    [["power", 4], ["fast", 10], ["basic", 0], ["armor", 6]],
    [["power", 4], ["fast", 6], ["basic", 0], ["armor", 10]]
  ];
  const palette = [']','_','[','-','#','}','v','{','^','@','~','T','*',' '];
  function paint(map, row, col, code) {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      let value = 0;
      if ('#]-_['.includes(code)) value = 1;
      if ('@}v{^'.includes(code)) value = 2;
      if (code === '~') value = 3;
      if (code === 'T') value = 4;
      if (code === '*') value = 5;
      if (']}'.includes(code) && x < 2) value = 0;
      if ('[{'.includes(code) && x >= 2) value = 0;
      if ('-^'.includes(code) && y >= 2) value = 0;
      if ('_v'.includes(code) && y < 2) value = 0;
      map[row * 4 + y][col * 4 + x] = value;
    }
  }
  function decode(rows) {
    const map = Array.from({length:52}, () => Array(52).fill(0));
    rows.forEach((line, row) => Array.from(line).forEach((code, col) => paint(map,row,col,code)));
    return map;
  }
  function wave(stage, hard = false) {
    return groups[hard ? 34 : (stage - 1) % 35].flatMap(([type, count]) => Array(count).fill(type));
  }
  const api = {maps, groups, palette, paint, decode, wave};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TankLevels = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
