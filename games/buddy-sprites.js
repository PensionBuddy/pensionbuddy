/*
  PensionBuddy sprite sheet, hand-authored 8-bit pixel art.

  FORMAT
  Every frame is an array of `h` strings, each exactly `w` characters long.
  One character is one pixel, looked up in `PBSprites.palette`; '.' is
  transparent. To edit a frame, just edit the characters, but keep every row
  the same length or the game will draw a ragged sprite.

  Buddy faces RIGHT, the Jargon Monster faces LEFT. Buddy's ground line (the
  bottom of his feet when standing) is the same row in every frame so he never
  floats; the jump frames tuck the legs up inside the same box.

  API
    PBSprites.palette              char -> CSS colour ('.' is null/transparent)
    PBSprites.buddy   { w, h, run[6], jump[3], hurt[1], idle[2], attack[2], happy[2] }
    PBSprites.blob    { w, h, idle[2], hurt[1], attack[2], faint[1] }
    PBSprites.props   { paw, heart, paper }   each a frames array, with .w/.h on it
    PBSprites.draw(ctx, frame, x, y, scale, flip)   fillRect per pixel
    PBSprites.bake(frame, scale, flip)             cached offscreen canvas
  Games read frame counts with anim.length.
*/
(function (global) {
  'use strict';

  var palette = {
    '.': null,        // transparent
    'K': '#1A1410',   // ink outline / black mask
    'k': '#33271F',   // mask highlight (lit plane of the black mask)
    'F': '#C4732F',   // fawn base
    'S': '#A85B22',   // fawn shade
    'L': '#DE9A5A',   // fawn light
    'W': '#FBF7EF',   // white
    'w': '#E4DCCF',   // white shade
    'C': '#2F6BD8',   // collar
    'c': '#F4B740',   // collar tag (amber)
    'T': '#E5798A',   // tongue
    'E': '#0B1F1C',   // eye
    'G': '#FFFFFF',   // eye glint
    'N': '#111111',   // nose
    'P': '#F4EFE4',   // paper
    'p': '#B9B3A6',   // paper grey / print
    'm': '#D8DFDC',   // paperclip metal
    'A': '#F4B740',   // sticky note amber
    'y': '#FCEFCF',   // amber soft
    'r': '#C1502E',   // terracotta
    'q': '#0C8175',   // jewel teal
    'Q': '#16C9B0'    // aqua
  };

  var buddy = {
    w: 36,
    h: 26,
    idle: [
      [
        "....................................",
        "....................................",
        ".........................KLLFFK.....",
        "....................KKKKKSKKKFFK....",
        "..................KKSSSSKKKKKKKK....",
        ".................KFSSSSSKEGFKkkkwNN.",
        ".................KFSSSSSKEESKkkkNNN.",
        "......KKK........KFSSSSSKFFSKkkkkkk.",
        ".....KFFK........KFSSSSSKFFSKKKKKKK.",
        "....KFFK.........KFSSSSKFFKWWkkkkk..",
        "....KFFFKKKKKKKK..KSSSSKFKWWWWkkk...",
        "....KFFLLLLLLLLLKKKKKKKFFKWWWKKK....",
        "....KFSSSFFFFFFFFFFCCCCFFKWWKSK.....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKK......",
        "....KSSSSSSFFFFFFFCCCCCCWWw.........",
        "....KSSSSSSFSSSSSFFFcWWWWw..........",
        ".....KSSSSSSKKKKKSFFFWWWWw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        "....KSSKKFFK.....KSSKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "..KSSK..KFFK...KWWK.KWWK............",
        "..KSSSK.KFFFK..KWWWKKWWWK..........."
      ],
      [
        "....................................",
        "....................................",
        ".........................KLLFFK.....",
        "........................KSKKKFFK....",
        "....................KKKKKKKKKKKK....",
        "..................KKSSSSKEGFKkkkwNN.",
        ".................KFSSSSSKEESKkkkNNN.",
        "......KKK........KFSSSSSKFFSKkkkkkk.",
        ".....KFFK........KFSSSSSKFFSKKKKKKK.",
        "....KFFK.........KFSSSSSKFKWWkkkkk..",
        "....KFFFKKKKKKKK.KFSSSSKFKWWWWkkk...",
        "....KFFLLLLLLLLLKKKSSSSKFKWWWKKK....",
        "....KFSSSFFFFFFFFFFKKKKFFKWWKSK.....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKK......",
        "....KSSSSSSFFFFFFFCCCCCCWWw.........",
        "....KSSSSSSFSSSSSFFFcWWWFw..........",
        ".....KSSSSSSKKKKKSFFFWWWFw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        "....KSSKKFFK.....KSSKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "..KSSK..KFFK...KWWK.KWWK............",
        "..KSSSK.KFFFK..KWWWKKWWWK..........."
      ]
    ],
    run: [
      [
        "....................................",
        "....................................",
        ".........................KLLFFK.....",
        "....................KKKKKSKKKFFK....",
        "..................KKSSSSKKKKKKKK....",
        ".................KFSSSSSKEGFKkkkwNN.",
        ".................KFSSSSSKEESKkkkNNN.",
        "......KKK........KFSSSSSKFFSKkkkkkk.",
        ".....KFFK........KFSSSSSKFFSKKKKKKK.",
        "....KFFK.........KFSSSSKFFKWWkkkkk..",
        "....KFFFKKKKKKKK..KSSSSKFKWWWWkkk...",
        "....KFFLLLLLLLLLKKKKKKKFFKWWWKKK....",
        "....KFSSSFFFFFFFFFFCCCCFFKWWKSK.....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKK......",
        "....KSSSSSSFFFFFFFCCCCCCWWw.........",
        "....KSSSSSSFSSSSSFFFcWWWWw..........",
        ".....KSSSSSSKKKKKSFFFWWWWw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        "....KSSKFFK......KSSKKFFK...........",
        "...KSSKKFFK.......KSSKFFK...........",
        "...KSSKFFK........KSSKKFFK..........",
        "...KSSKFFK........KSSKKFFK..........",
        "..KSSKFFK..........KWWKKFFK.........",
        "..KSSKFFK..........KWWWKWWK.........",
        "....KFFFK...............KWWWK......."
      ],
      [
        "....................................",
        "....................................",
        ".........................KLLFFK.....",
        "...................KKKKKKSKKKFFK....",
        ".................KKSSSSKKKKKKKKK....",
        "................KFSSSSSKFEGFKkkkwNN.",
        "................KFSSSSSKFEESKkkkNNN.",
        "......KKK.......KFSSSSSKFFFSKkkkkkk.",
        ".....KFFK.......KFSSSSSKFFFSKKKKKKK.",
        "....KFFK........KFSSSSKFFFKWWkkkkk..",
        "....KFFFKKKKKKKK.KSSSSKFFKWWWWkkk...",
        "....KFFLLLLLLLLLKKKKKKFFFKWWWKKK....",
        "....KFSSSFFFFFFFFFFCCCCFFKWWKSK.....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKK......",
        "....KSSSSSSFFFFFFFCCCCCCWWw.........",
        "....KSSSSSSFSSSSSFFFcWWWWw..........",
        ".....KSSSSSSKKKKKSFFFWWWWw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        "...KSSKKFFK.......KSKFFK............",
        "...KSSKKFFK.......KSKFFK............",
        "..KSSKKFFK.........KKFFK............",
        ".KSSKKFFK..........KSKFFK...........",
        ".KSSKFFK............KKFFK...........",
        "KSSSKFFK............KKWWK...........",
        "...KFFFK.............KWWWK.........."
      ],
      [
        "....................................",
        "....................................",
        ".........................KLLFFK.....",
        "...................KKKKKKSKKKFFK....",
        ".................KKSSSSKKKKKKKKK....",
        "................KFSSSSSKFEGFKkkkwNN.",
        "................KFSSSSSKFEESKkkkNNN.",
        "......KKK.......KFSSSSSKFFFSKkkkkkk.",
        ".....KFFK.......KFSSSSSKFFFSKKKKKKK.",
        "....KFFK........KFSSSSKFFFKWWkkkkk..",
        "....KFFFKKKKKKKK.KSSSSKFFKWWWWkkk...",
        "....KFFLLLLLLLLLKKKKKKFFFKWWWKKK....",
        "....KFSSSFFFFFFFFFFCCCCFFKWWKSK.....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKK......",
        "....KSSSSSSFFFFFFFCCCCCCWWw.........",
        "....KSSSSSSFSSSSSFFFcWWWWw..........",
        ".....KSSSSSSKKKKKSFFFWWWWw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        "...KSSK.KFFK.....KSSKFFK............",
        "...KSSKKFFK......KSKFFK.............",
        "..KSSK.KFFK......KSKFFK.............",
        ".KSSK..KFFK.......KKFFK.............",
        "KSSK...KFFK.......KKFFK.............",
        "KSSK..KFFK........KWWK..............",
        "SSSK..KFFFK.......KWWWK............."
      ],
      [
        "....................................",
        "...................KKKKK.KLLFFK.....",
        ".................KKSSSSKKSKKKFFK....",
        "................KFSSSSSKKKKKKKKK....",
        "................KFSSSSSKFEGFKkkkwNN.",
        "................KFSSSSSKFEESKkkkNNN.",
        "......KKK.......KFSSSSSKFFFSKkkkkkk.",
        ".....KFFK.......KFSSSSKFFFFSKKKKKKK.",
        "....KFFK.........KSSSSKFFFKWWkkkkk..",
        "....KFFFKKKKKKKK..KKKKFFFKWWWWkkk...",
        "....KFFLLLLLLLLLKKKKFFFFFKWWWKKK....",
        "....KFSSSFFFFFFFFFFCCCCFFKWWKSK.....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKK......",
        "....KSSSSSSFFFFFFFCCCCCCWWw.........",
        "....KSSSSSSFSSSSSFFFcWWWWw..........",
        ".....KSSSSSSKKKKKSFFFWWWWw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        "....KSSKKFFK.....KSKFFK.............",
        "....KSSK.KFFK...KSKFFK..............",
        "....KSSK.KFFK...KSKFFK..............",
        "....KSSK..KFFK..KKWWK...............",
        "....KSSK..KFFFKKKWWWK...............",
        "....KSSSK......KWWWK................",
        "....................................",
        "...................................."
      ],
      [
        "...................KKKKK.KLLFFK.....",
        ".................KKSSSSKKSKKKFFK....",
        "................KFSSSSSKKKKKKKKK....",
        "................KFSSSSSKFEGFKkkkwNN.",
        "................KFSSSSSKFEESKkkkNNN.",
        "......KKK.......KFSSSSSKFFFSKkkkkkk.",
        ".....KFFK.......KFSSSSKFFFFSKKKKKKK.",
        "....KFFK.........KSSSSKFFFKWWkkkkk..",
        "....KFFFKKKKKKKK..KKKKFFFKWWWWkkk...",
        "....KFFLLLLLLLLLKKKKFFFFFKWWWKKK....",
        "....KFSSSFFFFFFFFFFCCCCFFKWWKSK.....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKK......",
        "....KSSSSSSFFFFFFFCCCCCCWWw.........",
        "....KSSSSSSFSSSSSFFFcWWWWw..........",
        ".....KSSSSSSKKKKKSFFFWWWWw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        "....KSSK.KFFK....KSSKFFK............",
        ".....KSSKKFFK...KSSKKFFK............",
        ".....KSSK.KFFK.KSSK.KFFK............",
        ".....KSSK..KFFKKSSKKFFK.............",
        "......KSSK.KFFKKWWKKWWK.............",
        "......KSSSK.KFFFKWKKWWWK............",
        "....................................",
        "....................................",
        "...................................."
      ],
      [
        "....................................",
        "....................................",
        "...................KKKKK.KLLFFK.....",
        ".................KKSSSSKKSKKKFFK....",
        "................KFSSSSSKKKKKKKKK....",
        "................KFSSSSSKFEGFKkkkwNN.",
        "................KFSSSSSKFEESKkkkNNN.",
        "......KKK.......KFSSSSSKFFFSKkkkkkk.",
        ".....KFFK.......KFSSSSKFFFFSKKKKKKK.",
        "....KFFK.........KSSSSKFFFKWWkkkkk..",
        "....KFFFKKKKKKKK..KKKKFFFKWWWWkkk...",
        "....KFFLLLLLLLLLKKKKFFFFFKWWWKKK....",
        "....KFSSSFFFFFFFFFFCCCCFFKWWKSK.....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKK......",
        "....KSSSSSSFFFFFFFCCCCCCWWw.........",
        "....KSSSSSSFSSSSSFFFcWWWWw..........",
        ".....KSSSSSSKKKKKSFFFWWWWw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        ".....KSSKFFK.....KSSKFFK............",
        ".....KSSKFFK.....KSSKKFFK...........",
        "......KSSKFFK....KSSKKFFK...........",
        "......KSSKFFK....KWWK.KFFK..........",
        ".......KSKFFFK...KWWWKKFFK..........",
        ".......................KWWK.........",
        ".......................KWWWK........"
      ]
    ],
    jump: [
      [
        "....................................",
        "....................................",
        "....................................",
        ".........................KLLFFK.....",
        "........................KSKKKFFK....",
        "....................KKKKKKKKKKKK....",
        "..................KKSSSSKEGFKkkkwNN.",
        ".................KFSSSSSKEESKkkkNNN.",
        "......KKK........KFSSSSSKFFSKkkkkkk.",
        ".....KFFK........KFSSSSSKFFSKKKKKKK.",
        "....KFFK.........KFSSSSSKFKWWkkkkk..",
        "....KFFFKKKKKKKK.KFSSSSKFKWWWWkkk...",
        "....KFFLLLLLLLLLKKKSSSSKFKWWWKKK....",
        "....KFSSSFFFFFFFFFFKKKKFFKWWKSK.....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKK......",
        "....KSSSSSSFFFFFFFCCCCCCWWw.........",
        "....KSSSSSSFSSSSSFFFcWWWWw..........",
        ".....KSSSSSSKKKKKSFFFWWWWw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        ".....KSSKFFK....KSSKKFFK............",
        "......KSKFFK...KSSK.KFFK............",
        "......KSSKFFK..KWWKKWWK.............",
        ".......KSKFFFKKWWWKKWWWK............",
        "....................................",
        "...................................."
      ],
      [
        "...................KKKKK.KLLFFK.....",
        ".................KKSSSSKKSKKKFFK....",
        "................KFSSSSSKKKKKKKKK....",
        "................KFSSSSSKFEGFKkkkwNN.",
        "................KFSSSSSKFEESKkkkNNN.",
        "......KKK.......KFSSSSSKFFFSKkkkkkk.",
        ".....KFFK.......KFSSSSKFFFFSKKKKKKK.",
        "....KFFK.........KSSSSKFFFKWWkkkkk..",
        "....KFFFKKKKKKKK..KKKKFFFKWWWWkkk...",
        "....KFFLLLLLLLLLKKKKFFFFFKWWWKKK....",
        "....KFSSSFFFFFFFFFFCCCCFFKWWKSK.....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKK......",
        "....KSSSSSSFFFFFFFCCCCCCWWw.........",
        "....KSSSSSSFSSSSSFFFcWWWWw..........",
        ".....KSSSSSSKKKKKSFFFWWWWw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        ".....KSSKFFK....KSSKKFFK............",
        "......KSSKFFK..KSSKKFFK.............",
        "......KSSKKFFK.KSSKFFK..............",
        ".......KSSKFFKKSSKKFFK..............",
        "........KSKFFKWWK.KWWK..............",
        ".........KSKFFFKKKWWWK..............",
        "....................................",
        "....................................",
        "...................................."
      ],
      [
        "....................................",
        "....................................",
        ".........................KLLFFK.....",
        "........................KSKKKFFK....",
        "....................KKKKKKKKKKKK....",
        "..................KKSSSSKEGFKkkkwNN.",
        ".................KFSSSSSKEESKkkkNNN.",
        "......KKK........KFSSSSSKFFSKkkkkkk.",
        ".....KFFK........KFSSSSSKFFSKKKKKKK.",
        "....KFFK.........KFSSSSSKFKWWkkkkk..",
        "....KFFFKKKKKKKK.KFSSSSKFKWWWWkkk...",
        "....KFFLLLLLLLLLKKKSSSSKFKWWWKKK....",
        "....KFSSSFFFFFFFFFFKKKKFFKWWKSK.....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKK......",
        "....KSSSSSSFFFFFFFCCCCCCWWw.........",
        "....KSSSSSSFSSSSSFFFcWWWWw..........",
        ".....KSSSSSSKKKKKSFFFWWWWw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        "....KSSKKFFK.....KSSKFFK............",
        "....KSSKFFK......KSSKKFFK...........",
        "....KSSKFFK......KSSKKFFK...........",
        "...KSSKFFK........KSSKKFFK..........",
        "...KSSKFFK........KSSKKFFK..........",
        "...KSKFFK.........KWWK.KWWK.........",
        "...KSKFFFK........KWWWKKWWWK........"
      ]
    ],
    hurt: [
      [
        "....................................",
        "....................................",
        "..................KKKKK.KLLFFK......",
        "................KKSSSSKKSKKKFFK.....",
        "...............KFSSSSSKKKKKKKKK.....",
        "...............KFSSSSSKFKFFKkkkwNN..",
        "...............KFSSSSSKKFKSKkkkNNN..",
        ".....KKK.......KFSSSSSKFFFSKkkkkkk..",
        "....KFFK.......KFSSSSKFFFFSKKKKKKK..",
        "...KFFK.........KSSSSKFFFKWWkkkkk...",
        "...KFFFKKKKKKKK..KKKKFFFKWWWWkkk....",
        "...KFFLLLLLLLLLKKKKFFFFFKWWWKKK.....",
        "...KFSSSFFFFFFFFFFCCCCFFKWWKSK......",
        "...KSSSSSFFFFFFFFCCCCCCCWwKKK.......",
        "...KSSSSSSFFFFFFFCCCCCCWWw..........",
        "...KSSSSSSFSSSSSFFFcWWWWw...........",
        "....KSSSSSSKKKKKSFFFWWWWw...........",
        "....KSSSSSK.....KSSwWWWWw...........",
        "...KSKKKFFK.....KKKKFFKw............",
        "....KSSKFFK....KSSKKFFK.............",
        "....KSSKKFFK...KSSKFFK..............",
        ".....KSSKFFK..KSSKKFFK..............",
        "......KSKFFK.KSSK.KFFK..............",
        "......KSKFFK.KWWK.KFFK..............",
        ".......KSKFFKWWWKKWWK...............",
        ".........KFFFK...KWWWK.............."
      ]
    ],
    attack: [
      [
        "....................................",
        "....................................",
        "....................................",
        ".........................KLLFFK.....",
        "........................KSKKKFFK....",
        "....................KKKKKKKKKKKK....",
        "..................KKSSSSKKKKKkkkwNN.",
        ".................KFSSSSSKEESKkkkNNN.",
        "......KKK........KFSSSSSKFFSKkkkkkk.",
        ".....KFFK........KFSSSSSKFFSKKKKKKK.",
        "....KFFK.........KFSSSSSKFKWWkkkkk..",
        "....KFFFKKKKKKKK.KFSSSSKFKWWWWkkk...",
        "....KFFLLLLLLLLLKKKSSSSKFKWWWKKK....",
        "....KFSSSFFFFFFFFFFKKKKFFKWWKSK.....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKK......",
        "....KSSSSSSFFFFFFFCCCCCCWWw.........",
        "....KSSSSSSFSSSSSFFFcWWWWw..........",
        ".....KSSSSSSKKKKKSFFFWWWWw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        ".....KSSKFFK....KSSKKFFK............",
        "......KSSKFFK..KSSKKFFK.............",
        "......KSSKFFK..KSSKKFFK.............",
        ".......KSKFFK.KWWK.KFFK.............",
        "........KSKFFKWWWKKWWK..............",
        "..........KFFFK...KWWWK............."
      ],
      [
        "....................................",
        "....................................",
        "..........................KLLFFK....",
        "....................KKKKKKSKKKFFK...",
        "..................KKSSSSKKKKKKKKK...",
        ".................KFSSSSSKKKKKKkkkwNN",
        ".................KFSSSSSKFEESKkkkNNN",
        ".......KKK.......KFSSSSSKFFFSKkkkkkk",
        "......KFFK.......KFSSSSSKFFFKKKKKKKK",
        ".....KFFK........KFSSSSKFFFKTTTTTKk.",
        ".....KFFFKKKKKKKK.KSSSSKFFKWTTTTKk..",
        ".....KFFLLLLLLLLLKKKKKKFFFKWWTTKK...",
        ".....KFSSSFFFFFFFFFFCCCCFFKWWWKK....",
        ".....KSSSSSFFFFFFFFCCCCCCCWwKKK.....",
        ".....KSSSSSSFFFFFFFCCCCCCWWw........",
        ".....KSSSSSSFSSSSSFFFcWWWWw.........",
        "......KSSSSSSKKKKKSFFFWWWWw.........",
        "......KSSSSSK.....KSSwWWWWw.........",
        ".....KSKKKFFK.....KKKKFFKw..........",
        "....KSSK.KFFK.....KSSKFFK...........",
        "....KSSKKFFK......KSSKKFFK..........",
        "...KSSK.KFFK......KSSKKFFK..........",
        "..KSSK.KFFK........KSSKKFFK.........",
        ".KSSK..KFFK........KWWKKFFK.........",
        ".KSSK.KFFK.........KWWWKKWWK........",
        "KSSSK.KFFFK.............KWWWK......."
      ]
    ],
    happy: [
      [
        "....................................",
        "....................................",
        ".........................KLLFFK.....",
        "....................KKKKKSKKKFFK....",
        "..................KKSSSSKKKKKKKK....",
        ".................KFSSSSSKKKKKkkkwNN.",
        ".................KFSSSSSKFFKKkkkNNN.",
        "......KKK........KFSSSSSKFFSKkkkkkk.",
        ".....KFFK........KFSSSSSKFFKKKKKKKK.",
        "....KFFK.........KFSSSSKFFKTTTTTKk..",
        "....KFFFKKKKKKKK..KSSSSKFKWTTTTKk...",
        "....KFFLLLLLLLLLKKKKKKKFFKWWTTKK....",
        "....KFSSSFFFFFFFFFFCCCCFFKWWWTTT....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKTTT....",
        "....KSSSSSSFFFFFFFCCCCCCWWw...T.....",
        "....KSSSSSSFSSSSSFFFcWWWWw..........",
        ".....KSSSSSSKKKKKSFFFWWWWw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        "....KSSKKFFK.....KSSKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "..KSSK..KFFK...KWWK.KWWK............",
        "..KSSSK.KFFFK..KWWWKKWWWK..........."
      ],
      [
        "....................................",
        "....................KKKKKKLLFFK.....",
        "..................KKSSSSKSKKKFFK....",
        ".................KFSSSSSKKKKKKKK....",
        ".................KFSSSSSKKKKKkkkwNN.",
        ".................KFSSSSSKFFKKkkkNNN.",
        "......KKK........KFSSSSSKFFSKkkkkkk.",
        ".....KFFK........KFSSSSKFFFKKKKKKKK.",
        "....KFFK..........KSSSSKFFKTTTTTKk..",
        "....KFFFKKKKKKKK...KKKKFFKWTTTTKk...",
        "....KFFLLLLLLLLLKKKKFFFFFKWWTTKK....",
        "....KFSSSFFFFFFFFFFCCCCFFKWWWTTT....",
        "....KSSSSSFFFFFFFFCCCCCCCWwKKTTT....",
        "....KSSSSSSFFFFFFFCCCCCCWWw...T.....",
        "....KSSSSSSFSSSSSFFFcWWWWw..........",
        ".....KSSSSSSKKKKKSFFFWWWWw..........",
        ".....KSSSSSK.....KSSwWWWWw..........",
        "....KSKKKFFK.....KKKKFFKw...........",
        "....KSSKKFFK.....KSSKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "...KSSK.KFFK....KSSKKFFK............",
        "..KSSK..KFFK...KWWK.KWWK............",
        "..KSSSK.KFFFK..KWWWKKWWWK...........",
        "...................................."
      ]
    ]
  };

  var blob = {
    w: 38,
    h: 38,
    idle: [
      [
        "......................................",
        ".............mmm......................",
        "............m...m.....................",
        "............mKmKmKKKKKKKKKKKKKKKK.....",
        "............mKmPmPPPPPPPPPPPPPPPK.....",
        "............mPmPmPPPPPPPPPPPPPPPK.....",
        "...........KmpmpppppPppppPPPPPPPK.....",
        "..........KPPmmPPPPPPPPPPPPPPPPPK.....",
        "..........KPPppppppPpppppppPPPPPK.....",
        "..........KPPPPPPPPPPPPPPPPPPPPPK.....",
        "..........KPPpppppppppPPPPPPPPPPK.....",
        ".....KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK...",
        ".....KKKKPPPPPPPPPPPKKKPPPyyyyyyyyy...",
        ".....KPPKKKKPPPPPPPPPPPPPPyAAAAAAAA...",
        ".....KPPPPPKKKPPPPPPPPPPPPAKKKKAKKA...",
        ".....KPPKKKKKKPPKKKKKKPPPPAAAAAAAAA...",
        ".....KPPKKKWWKPPKKKWWKPPPPAKAKKKKKA...",
        ".....KPPKKKWWKPPKKKWWKPPPPAAAAAAAAA...",
        ".....KPPKWWWWKPPKWWWWKPPPPAKKKKAKAA...",
        ".....KPPKKKKKKPPKKKKKKPPPPppppppppp...",
        ".KKKKKPPPPPPPPPPPPPPPPPPPPPPPPPPPPKKKK",
        ".KPPKKPPPPPPKKKKKKKPPPPPPPPPPPPPPPKPPK",
        ".KKKKKPPPPPKPPPPPPPKPPPPPPPPPPPPPPKKKK",
        ".....KPPPPPPPPPPPPPPPPPPPPPPPPPPPPK...",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK.",
        "..KPPppppppppPppppppPPPPPPPrrrPPPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPrPPPrPPPPPK.",
        "..KPPppppppPpppppPPPPPPPPrPPPPPrPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPrPPPPPrPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPrPPPrPPPPPK.",
        "..KPPpppppppppppPpppppPPPPPrrrPPPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK.",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.",
        "........KPPPPPK.........KPPPPPK.......",
        "........KKKKKKK.........KKKKKKK.......",
        "......................................"
      ],
      [
        "......................................",
        "......................................",
        "..............mmm.....................",
        ".............m...m....................",
        ".............mKmKmKKKKKKKKKKKKKKKK....",
        ".............mKmPmPPPPPPPPPPPPPPPK....",
        ".............mPmPmPPPPPPPPPPPPPPPK....",
        "............KmpmpppppPppppPPPPPPPK....",
        "...........KPPmmPPPPPPPPPPPPPPPPPK....",
        "...........KPPppppppPpppppppPPPPPK....",
        "...........KPPPPPPPPPPPPPPPPPPPPPK....",
        "...........KPPppKKKKKKpPPPPPPPPPPK....",
        "......KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "......KPPKKKKPPPPPPPPPPPPPPyyyyyyyyy..",
        "......KPPPPPKKKPPPPPPPPPPPPyAAAAAAAA..",
        "......KPPKKKKKKPPKKKKKKPPPPAKKKKAKKA..",
        "......KPPKKKWWKPPKKKWWKPPPPAAAAAAAAA..",
        "......KPPKKKWWKPPKKKWWKPPPPAKAKKKKKA..",
        "......KPPKWWWWKPPKWWWWKPPPPAAAAAAAAA..",
        "......KPPKKKKKKPPKKKKKKPPPPAKKKKAKAKKK",
        "......KPPPPPPPPPPPPPPPPPPPPppppppppKPP",
        "..KKKKKPPPPPPKKKKKKKPPPPPPPPPPPPPPPKKK",
        "..KPPKKPPPPPKPPPPPPPKPPPPPPPPPPPPPPK..",
        "..KKKKKPPPPPPPPPPPPPPPPPPPPPPPPPPPPK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
        "...KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK",
        "...KPPppppppppPppppppPPPPPPPrrrPPPPPPK",
        "...KPPPPPPPPPPPPPPPPPPPPPPPrPPPrPPPPPK",
        "...KPPppppppPpppppPPPPPPPPrPPPPPrPPPPK",
        "...KPPPPPPPPPPPPPPPPPPPPPPrPPPPPrPPPPK",
        "...KPPPPPPPPPPPPPPPPPPPPPPPrPPPrPPPPPK",
        "...KPPpppppppppppPpppppPPPPPrrrPPPPPPK",
        "...KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK",
        "...KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
        ".........KPPPPPK.........KPPPPPK......",
        ".........KKKKKKK.........KKKKKKK......",
        "......................................"
      ]
    ],
    hurt: [
      [
        "......................................",
        "......................................",
        "................mmm...................",
        "...............m...m..................",
        "...............mKmKmKKKKKKKKKKKKKKKK..",
        "...............mKmPmPPPPPPPPPPPPPPPK..",
        "...............mPmPmPPPPPPPPPPPPPPPK..",
        "..............KmpmpppppPppppPPPPPPPK..",
        ".............KPPmmPPPPPPPPPPPPPPPPPK..",
        ".............KPPppppppPpppppppPPPPPK..",
        ".............KPPPPPPPPPPPPPPPPPPPPPK..",
        ".............KPPpppppppppPPyyyyyyyyy..",
        "......KKKKKKKKKKKKKKKKKKKKKyAAAAAAAA..",
        "......KPPPPPPPPPPPPPPPPPPPPAKKKKAKKA..",
        "......KPPKKPPPPPPPPPKKPPPPPAAAAAAAAA..",
        "......KPPPPPPPPPPPPPPPPPPPPAKAKKKKKA..",
        "......KPPPPPPPPPPPPPPPPPPPPAAAAAAAAA..",
        "......KPPPKKKKKPPKKKKKPPPPPAKKKKAKAA..",
        "......KPPPPPPPPPPPPPPPPPPPPppppppppp..",
        "..KKKKKPPPPPPPPPPPPPPPPPPPPPPPPPPPPK..",
        "..KPPKKPPPPPKPPPPPPPPPPPPPPPPPPPPPPK..",
        "..KKKKKPPPPPPKKKKKKKPPPPPPPPPPPPPPPKKK",
        "......KPPPPPPPPPPPPPKPPPPPPPPPPPPPPKPP",
        "......KPPPPPPPPPPPPPPPPPPPPPPPPPPPPKKK",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
        "...KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK",
        "...KPPppppppppPppppppPPPPPPPrrrPPPPPPK",
        "...KPPPPPPPPPPPPPPPPPPPPPPPrPPPrPPPPPK",
        "...KPPppppppPpppppPPPPPPPPrPPPPPrPPPPK",
        "...KPPPPPPPPPPPPPPPPPPPPPPrPPPPPrPPPPK",
        "...KPPPPPPPPPPPPPPPPPPPPPPPrPPPrPPPPPK",
        "...KPPpppppppppppPpppppPPPPPrrrPPPPPPK",
        "...KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK",
        "...KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
        ".........KPPPPPK.........KPPPPPK......",
        ".........KKKKKKK.........KKKKKKK......",
        "......................................"
      ]
    ],
    attack: [
      [
        "......................................",
        "............mmm.......................",
        "...........m...m......................",
        "...........mKmKmKKKKKKKKKKKKKKKK......",
        "...........mKmPmPPPPPPPPPPPPPPPK......",
        "...........mPmPmPPPPPPPPPPPPPPPK......",
        "..........KmpmpppppPppppPPPPPPPK......",
        ".........KPPmmPPPPPPPPPPPPPPPPPK......",
        ".........KPPppppppPpppppppPPPPPK......",
        ".........KPPPPPPPPPPPPPPPPPPPPPK......",
        ".........KPPpppppppppPPPPPPPPPPK......",
        ".....KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK...",
        ".....KKKKPPPPPPPPPPPKKKPPPyyyyyyyyy...",
        ".....KPPKKKKPPPPPPPPPPPPPPyAAAAAAAA...",
        ".....KPPPPPKKKPPPPPPPPPPPPAKKKKAKKA...",
        ".....KPPKKKKKKPPKKKKKKPPPPAAAAAAAAA...",
        ".....KPPKKKWWKPPKKKWWKPPPPAKAKKKKKA...",
        ".....KPPKKKWWKPPKKKWWKPPPPAAAAAAAAA...",
        ".....KPPKWWWWKPPKWWWWKPPPPAKKKKAKAA...",
        ".....KPPKKKKKKPPKKKKKKPPPPppppppppp...",
        ".KKKKKPPPPPKKKKKKKKKPPPPPPPPPPPPPPKKKK",
        ".KPPKKPPPPPKWWWWWWWKPPPPPPPPPPPPPPKPPK",
        ".KKKKKPPPPPKKKKKKKKKPPPPPPPPPPPPPPKKKK",
        ".....KPPPPPKKKKKKKKKPPPPPPPPPPPPPPK...",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK.",
        "..KPPppppppppPppppppPPPPPPPrrrPPPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPrPPPrPPPPPK.",
        "..KPPppppppPpppppPPPPPPPPrPPPPPrPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPrPPPPPrPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPrPPPrPPPPPK.",
        "..KPPpppppppppppPpppppPPPPPrrrPPPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK.",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.",
        "........KPPPPPK.........KPPPPPK.......",
        "........KKKKKKK.........KKKKKKK.......",
        "......................................"
      ],
      [
        "......................................",
        ".........mmm..........................",
        "........m...m.........................",
        "........mKmKmKKKKKKKKKKKKKKKK.........",
        "........mKmPmPPPPPPPPPPPPPPPK.........",
        "........mPmPmPPPPPPPPPPPPPPPK.........",
        ".......KmpmpppppPppppPPPPPPPK.........",
        "......KPPmmPPPPPPPPPPPPPPPPPK.........",
        "......KPPppppppPpppppppPPPPPK.........",
        "......KPPPPPPPPPPPPPPPPPPPPPK.........",
        "......KPPpppppppppPPPPPPPPPPK.........",
        "....KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK....",
        "....KKKKPPPPPPPPPPPKKKPPPyyyyyyyyy....",
        "....KPPKKKKPPPPPPPPPPPPPPyAAAAAAAA....",
        "....KPPPPPKKKPPPPPPPPPPPPAKKKKAKKA....",
        "....KPPKKKKKKPPKKKKKKPPPPAAAAAAAAA....",
        "....KPPKKKWWKPPKKKWWKPPPPAKAKKKKKA....",
        "....KPPKKKWWKPPKKKWWKPPPPAAAAAAAAA....",
        "....KPPKWWWWKPPKWWWWKPPPPAKKKKAKAA....",
        "....KPPKKKKKKPPKKKKKKPPPPppppppppp....",
        "....KPPPPPKKKKKKKKKPPPPPPPPPPPPPPK....",
        "KKKKKPPPPPKWWWWWWWKPPPPPPPPPPPPPPKKKK.",
        "KPPKKPPPPPKKKKKKKKKPPPPPPPPPPPPPPKPPK.",
        "KKKKKPPPPPKKKKKKKKKPPPPPPPPPPPPPPKKKK.",
        ".KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        ".KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK..",
        ".KPPppppppppPppppppPPPPPPPrrrPPPPPPK..",
        ".KPPPPPPPPPPPPPPPPPPPPPPPrPPPrPPPPPK..",
        ".KPPppppppPpppppPPPPPPPPrPPPPPrPPPPK..",
        ".KPPPPPPPPPPPPPPPPPPPPPPrPPPPPrPPPPK..",
        ".KPPPPPPPPPPPPPPPPPPPPPPPrPPPrPPPPPK..",
        ".KPPpppppppppppPpppppPPPPPrrrPPPPPPK..",
        ".KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK..",
        ".KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK..",
        ".KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        ".......KPPPPPK.........KPPPPPK........",
        ".......KKKKKKK.........KKKKKKK........",
        "......................................"
      ]
    ],
    faint: [
      [
        "......................................",
        "......................................",
        "......................................",
        "......................................",
        "......................................",
        "......................................",
        "......................................",
        "......................................",
        "......................................",
        "..................mmm.................",
        ".................m...m................",
        ".................mKmKmKKKKKKKKKKKKKKKK",
        ".................mKmPmPPPPPPPPPPPPPPPK",
        ".................mPmPmPPPPPPPPPPPPPPPK",
        "................KmpmpppppPppppPPPPPPPK",
        "...............KPPmmPPPPPPPPPPPPPPPPPK",
        ".....KKKKKKKKKKKKKKKKKKKKyyyyyyyyyKPPK",
        ".....KPPPPPPPPPPPPPPPPPPPyAAAAAAAAKPPK",
        ".....KPPKKPKKPPPKKPKKPPPPAKKKKAKKAKPPK",
        ".....KPPPKKKPPPPPKKKPPPPPAAAAAAAAAKPPK",
        ".....KPPKKPKKPPPKKPKKPPPPAKAKKKKKAKPPK",
        ".....KPPPPPPPKKPPPPPPPPPPAAAAAAAAAKPPK",
        ".....KPPPKKKKPPKKKKPPPPPPAKKKKAKAAKPPK",
        ".KKKKKPPPPPPPPPPPPPPPPPPPpppppppppKKKK",
        ".KPPKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKPPK",
        ".KKKKPPPPPPPPPPPPPPPPPPPPPPPPKKKKKKKKK",
        "..KPPppppppppPppppppPPPPPPPrrrPPPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPrPPPrPPPPPK.",
        "..KPPppppppPpppppPPPPPPPPrPPPPPrPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPrPPPPPrPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPrPPPrPPPPPK.",
        "..KPPpppppppppppPpppppPPPPPrrrPPPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK.",
        "..KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK.",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.",
        "........KPPPPPK.........KPPPPPK.......",
        "........KKKKKKK.........KKKKKKK.......",
        "......................................"
      ]
    ]
  };

  var props = {
    paw: [
      [
        "..qq.qq..",
        "..qq.qq..",
        "qq.....qq",
        "qq.....qq",
        "..qqqqq..",
        ".qqqqqqq.",
        "qqqqqqqqq",
        ".qqqqqqq.",
        "..qqqqq.."
      ]
    ],
    heart: [
      [
        ".rr...rr.",
        "rrrrrrrrr",
        "rrWrrrrrr",
        "rrrrrrrrr",
        ".rrrrrrr.",
        "..rrrrr..",
        "...rrr...",
        "....r...."
      ]
    ],
    paper: [
      [
        "KKKKKK..",
        "KPPPPPK.",
        "KPppppPK",
        "KPPPPPPK",
        "KPpppppK",
        "KPPPPPPK",
        "KPpppPPK",
        "KKKKKKKK"
      ]
    ]
  };
  props.paw.w = 9; props.paw.h = 9;
  props.heart.w = 9; props.heart.h = 8;
  props.paper.w = 8; props.paper.h = 8;

  function draw(ctx, frame, x, y, scale, flip) {
    scale = Math.max(1, Math.round(scale || 1));
    var h = frame.length, w = frame[0].length, r, c, ch, col, px;
    for (r = 0; r < h; r++) {
      for (c = 0; c < w; c++) {
        ch = frame[r].charAt(c);
        col = palette[ch];
        if (!col) { continue; }
        px = flip ? (w - 1 - c) : c;
        ctx.fillStyle = col;
        ctx.fillRect(x + px * scale, y + r * scale, scale, scale);
      }
    }
  }

  var cache = typeof WeakMap === 'function' ? new WeakMap() : null;
  var listKeys = [], listVals = [];

  function bucket(frame) {
    var b;
    if (cache) {
      b = cache.get(frame);
      if (!b) { b = {}; cache.set(frame, b); }
      return b;
    }
    var i = listKeys.indexOf(frame);
    if (i >= 0) { return listVals[i]; }
    b = {};
    listKeys.push(frame);
    listVals.push(b);
    return b;
  }

  function bake(frame, scale, flip) {
    scale = Math.max(1, Math.round(scale || 1));
    var key = scale + (flip ? 'f' : 'n');
    var b = bucket(frame);
    if (b[key]) { return b[key]; }
    var w = frame[0].length, h = frame.length;
    var cv = document.createElement('canvas');
    cv.width = w * scale;
    cv.height = h * scale;
    var cx = cv.getContext('2d');
    draw(cx, frame, 0, 0, scale, flip);
    b[key] = cv;
    return cv;
  }

  global.PBSprites = {
    palette: palette,
    buddy: buddy,
    blob: blob,
    props: props,
    draw: draw,
    bake: bake
  };
}(this));
