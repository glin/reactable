# grouping

    Code
      results
    Output
      $data
          mfr type model price __state.id __state.grouped
      1 Acura    2    NA     3  mfr:Acura            TRUE
      2  Audi    2    NA    12   mfr:Audi            TRUE
      3   BMW    1    NA     5    mfr:BMW            TRUE
                                                                                                                                                                     .subRows
      1 Acura, Acura, Small, Midsize, NA, NA, 1, 2, mfr:Acura>type:Small, mfr:Acura>type:Midsize, TRUE, TRUE, Acura, Integra, 1, Small, 0, 0, Acura, Legend, 2, Midsize, 1, 1
      2                                                          Audi, Compact, NA, 12, mfr:Audi>type:Compact, TRUE, Audi, Audi, 90, 100, 2, 10, Compact, Compact, 2, 3, 2, 3
      3                                                                                          BMW, Midsize, NA, 5, mfr:BMW>type:Midsize, TRUE, BMW, 535i, 5, Midsize, 4, 4
      
      $rowCount
      [1] 3
      
      $maxRowCount
      [1] 3
      
      attr(,"class")
      [1] "reactable_resolvedData"

# grouping with paginateSubRows=true

    Code
      results
    Output
      $data
          mfr type model price __state.id __state.grouped __state.subRowCount
      1 Acura    2    NA     3  mfr:Acura            TRUE                   2
      2  Audi    2    NA    12   mfr:Audi            TRUE                   1
      3   BMW    1    NA     5    mfr:BMW            TRUE                   1
      
      $rowCount
      [1] 3
      
      $maxRowCount
      [1] 12
      
      attr(,"class")
      [1] "reactable_resolvedData"

