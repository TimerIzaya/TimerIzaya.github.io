---
layout:     post
title:      差分算法分析：Myers vs DP
subtitle:   
date:       2023-11-8
author:     TimerIzaya
header-img: img/the-first.png
catalog: false
tags:
    - 算法

---

## 最短编辑距离问题 ≈ 最长公共子序列（longestCommonSubsequence, LCS）问题

## LCS

- ### DP

  假设现要求序列X与Y的LCS，X长度为m，Y长度为n。

  - 假设X[0: m - 1] 与 Y的LCS为R1，是否有可能是答案？当然可能，因为X[m - 1]可能完全没有卵用。
  - 假设X[m] 与 Y[0: n - 1]的LCS的为R2，是否有可能是答案？也可能，因为Y[m - 1]也可能完全没有卵用。
  - 假设X[0: m - 1]与Y[0: n - 1]的LCS为R3，是否有可能是答案？
    - 如果X[m - 1]和Y[m - 1]不同，那都没有卵用，那么R3可能是答案。
    - 如果X[m - 1]和Y[m - 1]相同，那有点用了，R3+1可能是答案。

  当前的最优解，取决于相邻三处的最优解。

  #### 所以动态方程为

  ```javascript
  令dp[i][j]为X[0: i]与Y[0: j]的最优解
  则dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1] + dp[i] == dp[j] ? 1 : 0)
  ```

  时间复杂度为o(m * n), 空间复杂度O(m * n)

  

  #### 优化1：滚动数组

  还是太慢了，空间需要O(m * 2)

  

  #### 优化2：滚动对角线

  当前场景的极致优化，空间只需要O(m)

  ```java
  class Solution {
      public int longestCommonSubsequence(String text1, String text2) {
          char[] arr1 = text1.toCharArray(), arr2 = text2.toCharArray();
          int m = arr1.length, n = arr2.length;
          int[] dp = new int[m + 1];
          int ret = 0;
          for (int i = 1; i < n + 1; i++) {
              char c = arr2[i - 1];
              int dia = 0;
              for (int j = 1; j < m + 1; j++) {
                  int left = dp[j - 1], upper = dp[j];
                  int same = c == arr1[j - 1] ? 1 : 0;
                  dp[j] = Math.max(dia + same, Math.max(left, upper));
                  dia = upper;
                  ret = Math.max(ret, dp[j]);
              }
          }
          return ret;
      }
  }
  ```

  

- ### Myers(BFS+Greedy)



