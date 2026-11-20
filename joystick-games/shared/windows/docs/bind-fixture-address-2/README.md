# Windows bind fixture address correction

Run `44647675594` / source `772c99ae35583ad1594cd9fffcc6368aa4df7201` compiled both hosts successfully. Both jobs passed the four existing CTest groups, then failed the new first `controller-bind` case. The original `build.log` and `ctest-last-test.log` are retained unchanged and bound to immutable export `b498971a645158e9ae097b4b81a13234908399ed`; neither bootstrap nor gameplay ran, and no installation package was produced.

The original test made both exclusive sockets bind wildcard addresses but required error 10013. Microsoft's archived same-user Windows Server 2003+ matrix specifies 10048 for that tuple, and 10013 when the second socket instead uses a specific interface. The old merged assertion omitted actual numeric results, so this finding does not retroactively label the original observed error as 10048.

Only `tests/controller-bind.test.cpp` changes. It retains wildcard/wildcard cases requiring 10048 and adds loopback-specific contenders requiring 10013, each with bound-only and listening holders. All four must make exactly one port-zero fallback and retain that endpoint across three real connections; the invalid-socket error still must fail without fallback. Actual options, addresses, errors and fallback endpoints are printed before the checks. Production binding, 63485 default, exclusive mode and the other four recently frozen source files are unchanged.

The local optimized, NDEBUG C++ build and seven portable policy cases passed. This Linux run does not execute Windows socket cases. The new Windows cases remain pending the next source-bound run; a specific-interface component test does not claim production wildcard 10013 has been reproduced. No game/action/lifecycle assertions or workflow budgets changed.
