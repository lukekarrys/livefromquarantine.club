const extraDescriptions = {
  '4/23/20': `
    00:21 Unobstructed Views
    05:17 Passenger Seat
    10:25 The Ice Is Getting Thinner
    15:07 Tulsa Telephone Book [Tom T. Hall cover]
    18:21 (Q & A)
    24:26 Binary Sea
    28:22 What Sarah Said
    33:57 Proxima B
    39:03 All Apologies [Nirvana cover]
    42:34 (Seattle Artist Relief Fund Amid COVID-19 charity shout out)
    44:08 Blacking Out the Friction
    47:32 Soul Meets Body
  `,
  '4/16/20': `
    00:33 Your Heart is an Empty Room
    04:13 Autumn Love
    08:43 Styrofoam Plates
    13:49 Willamine 
    18:21 (Q & A)
    25:40 Man In Blue
    30:28 Grapevine Fires
    37:23 Photobooth
    42:27 A Movie Script Ending
    46:23 Don't Cry No Tears [Neil Young cover]
  `,
  '4/9/20': `
    00:26 Title Track
    05:14 Employment Pages
    09:51 For What Reason
    13:53 Lowell, MA
    17:09 (Q & A #1)
    23:48 405
    28:15 Little Fury Bugs
    32:46 Company Calls
    37:54 Company Calls Epilogue
    43:16 (Q & A #2)
    51:03 No Joy in Mudville
    57:34 Scientist Studies
  `,
  '4/2/20': `
    0:24 - Lightness
    4:10 - Everything's A Ceiling
    9:02 - The Ghosts of Beverly Drive
    14:08 - A Hard One to Know
    16:15 - (Q&A)
    25:49 - When We Drive
    30:25 - Passenger Seat
    34:09 - (s/o to MusiCares)
    37:40 - Pictures in an Exhibition
    42:49 - Barbara H. (by Fountains of Wayne, tribute to Adam Schlesinger)
    47:20 - Song for Kelly Huckaby
  `,
  '3/29/20': `
    00:58 "Half A World Away” by R.E.M.
    05:26 "Just Like Heaven” by The Cure
    09:47 "Everyday Is Like Sunday” by Morrissey
    15:12 "Out of Touch” by Hall & Oates
    20:13 "Strange Powers” by The Magnetic Fields
    31:21 "Harvest Moon” by Neil Young
    35:20 "Please Don't Tell Me How the Story Ends” by Kris Kristofferson
    40:44 "The Only Living Boy in New York” by Simon & Garfunkel
    47:08 "Hold On” by Spiritualized
  `,
  '3/28/20': `
    00:51 Me and Magdalena
    05:52 Underwater
    08:56 El Dorado
    13:25 Duncan where have you gone?
    21:39 Stable Song
    25:00 Summer Years
    38:20 Life in Quarantine
    42:47 St Swithin's Day
    47:36 I'm Building a Fire
  `,
  '3/27/20': `
    00:41 Title and Registration
    05:25 A Lack of Color
    09:45 Tiny Vessels
    14:59 We Looked Like Giants
    19:43 The District Sleeps Alone Tonight [The Postal Service]
    23:20 (Q & A)
    30:32 I Will Possess Your Heart
    33:26 Soul Meets Body
    37:11 (Americans for Immigrant Justice mention)
    40:35 I Will Follow You into the Dark
    44:56 Transatlanticism
    53:20 Such Greats Heights [The Postal Service]
  `,
  '3/26/20': `
    00:22 Ingénue
    04:06 Autumn Love
    08:33 Hold No Guns
    13:19 Lily
    16:15 It's Never Too Late (End Credits)
    19:19 (Q & A)
    29:44 Binary Sea
    33:58 December
    37:57 Man In Blue
    41:16 (Supplies Save Lives WA mention)
    43:08 Northern Lights
    48:19 Black Sun
  `,
  '3/25/20': `
    0:23: You Can Do Better Than Me
    2:47: Unobstructed Views
    7:34: Little Bribes
    11:34: A Diamond and a Tether
    18:07: Where Our Destination Lies
    20:49: Cath...
    34:44: One Fast Move or I'm Gone
    39:32: Grapevine Fires
    43:44: Bixby Canyon Bridge
    50:42: Stay Young, Go Dancing
  `,
  '3/24/20': `
    00:02 Transatlanticism
    5:37 Someday You Will Be Loved
    9:44 Farmer Chords
    13:02 This Place Is a Prison [The Postal Service]
    17:58 Couches In Alleys [Styrofoam]
    20:42 (Q & A)
    27:09 Sleeping In [The Postal Service]
    30:02 Summer Skin
    32:25 What Sarah Said
    38:11 Title and Registration
    42:47 (Feeding UW Hospital Staff GoFundMe)
    44:42 Marching Bands of Manhattan
    49:39 I Will Follow You into the Dark
  `,
  '3/23/20': `
    00:31 Champagne from a Paper Cup
    04:08 Debate Exposes Doubt
    07:54 Scientist Studies
    13:28 Wait [Secret Stars cover] 
    17:27 Company Calls Epilogue
    22:47 (Q & A)
    28:17 Cleveland [¡All-Time Quarterback!]
    31:05 (This Is) The Dream of Evan and Chan [Dntel]
    34:51 Blacking Out the Friction
    37:40 Line of Best Fit 
    44:18 I Was a Kaleidoscope
    49:24 No Joy in Mudville
    55:21 The Face That Launched 1000 Shits [The Revolutionary Hydra cover]
  `,
  '3/22/20': `
    0:48: Isolation
    5:43: Silver Lining
    10:05: Thirteen 
    14:11: Waltz #2 (XO)
    19:19: Motion Sickness
    24:36: If Not For You
    33:52: New Slang (When You Notice The Stripes)
    39:38: Hysteria
    44:33: The Bones Are The Skeletons’ Money
    46:39: Do You Realize?
  `,
  '3/21/20': `
    0:35 Lady Adelaide
    4:22 Recycled Air
    8:34 Your New Twin Sized Bed
    13:35 Willamine
    17:29 Q&A
    24:24 A Movie Script Ending
    29:44 Your Hurricane
    33:14 Your Heart Is An Empty Room
    39:38 Carolina
    42:07 PSA
    44:30 I Will Follow You Into The Dark
  `,
  '3/20/20': `
    1:10 - Steadier Footing
    3:20 - You Remind Me of Home
    6:33 - Why You'd Want To Live Here
    11:15 - Q&A
    17:14 - When The Sun Goes Down On Your Street
    20:37 - These Roads Don't Move
    24:03 - Coney Island
    26:54 - Keep Yourself Warm (Frightened Rabbit cover)
    31:00 - New Horizon Ministries
    34:14 - Life In Quarantine
    38:35 - Something's Rattling
    43:07 - Brand New Colony
  `,
  '3/19/20': `
    0:10 - St. Peter's Cathedral
    4:04 - Photobooth
    8:30 -  405
    12:41 - Little Wanderer
    (17:15 - Q&A)
    20:55 - Brother's on a Hotel Bed
    24:24 - Soul Meets Body
    28:13 - Talking Bird
    (32:00 - University District Food Bank)
    33:56 - 60 & Punk
    38:47 - Grace Cathedral Hill (The Decemberists cover!!!)
    44:07 - Broken Yolk in Western Sky
    48:54 - The Sound of Settling
  `,
  '3/18/20': `
    0:11: No Room In Frame
    4:11: Teardrop Windows
    9:17: Title and Registration
    15:54: Technicolor Girls
    19:44: Codes and keys
    23:37: Passenger Seat
    27:48: When We Drive
    36:23: Me and Magdalena
    41:35: Ceremony
    46:07: Such Great Heights
  `,
  'Ben Gibbard: Live From Home': `
    0:19: We Will Become Silhouettes
    3:38: A Lack of Color
    7:46: Title Track
    12:22: Northern Lights
    18:30: Crooked Teeth
    22:34: Cath...
    28:39: Grapevine Fires
    33:54: Fake Plastic Trees
    40:01: California Zephyr
    44:06: The District Sleeps Alone Tonight
  `,
}

const getSongsFromText = (title) => {
  const text = extraDescriptions[title]
  const descLines = text.split('\n')
  const songLines = descLines.filter((line) => /\d+:\d+/.test(line))
  return songLines.map((line) => {
    const [match, start, end] = line.match(/(\d+:\d+)(?: ?- ?(\d+:\d+))?/)
    const name = line.replace(match, '')
    return {
      name: name.trim().replace(/^[-:]/, '').replace(/[-:]$/, '').trim(),
      time: {
        start,
        end,
      },
    }
  })
}

const skipIds = []

module.exports.parse = (items) => {
  const data = items
    .map((r) => {
      const {
        title,
        resourceId: { videoId },
      } = r.snippet
      const fullTitle = title
        .replace(/Ben Gibbard: Live From Home \((.*)\)/i, '$1')
        .trim()
      const songs = getSongsFromText(fullTitle)

      return {
        title: fullTitle,
        id: videoId,
        songs,
      }
    })
    .filter(Boolean)
    .filter((video) => {
      return !skipIds.includes(video.id)
    })
    .filter((video, index, videos) => {
      return videos.findIndex((v) => v.id === video.id) === index
    })

  return data
}

module.exports.meta = {
  title: 'Ben Gibbard – Live From Home',
  description: 'All the Ben Gibbard Live From Home songs',
  id: 'bengibbard',
  api:
    'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=PLVuKHi9v2Rn6WytY_26KfgO2F2yp4Gqgv',
  main: `
    <a href="https://venmo.com/BenGibbardLiveFromHome" target="_blank">Venmo: @BenGibbardLiveFromHome</a>
  `,
}
