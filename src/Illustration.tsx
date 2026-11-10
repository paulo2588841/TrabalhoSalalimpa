export default function Illustration() {
  return <svg viewBox="0 0 590 470" className="classroom-art" role="img" aria-labelledby="classroom-title">
    <title id="classroom-title">Ilustração de uma sala organizada, com plantas, mesas e lixeiras para coleta seletiva</title>
    <defs>
      <linearGradient id="wall" x2="1" y2="1"><stop stopColor="#e3f2e3" /><stop offset="1" stopColor="#cee5d5" /></linearGradient>
      <linearGradient id="floor" x2="1" y2="1"><stop stopColor="#e6eee1" /><stop offset="1" stopColor="#b9d4c5" /></linearGradient>
      <linearGradient id="board" x2="1" y2="1"><stop stopColor="#155e51" /><stop offset="1" stopColor="#0c3c38" /></linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#174c3d" floodOpacity=".13" /></filter>
    </defs>
    <ellipse cx="302" cy="411" rx="248" ry="32" fill="#0e6756" opacity=".07" />
    <g filter="url(#shadow)"><path d="m53 318 223-119 266 118-224 125Z" fill="url(#floor)" /><path d="M53 318V99L276 29v219Z" fill="url(#wall)" /><path d="m276 29 266 92v196L276 248Z" fill="#e9f3e7" /></g>
    <path d="M53 99 276 29l266 92" fill="none" stroke="#fff" strokeWidth="5" />
    <path d="M88 127v117l127-44V86Z" fill="#6da995" /><path d="m96 132 111-36v97L96 231Z" fill="#d2efe8" />
    <path d="m151 114 1 98M96 181l111-37" stroke="#fff" strokeWidth="7" />
    <path d="m107 153 24-8m40 37 23-8" stroke="#fff" strokeWidth="4" opacity=".8" />
    <path d="m306 74 201 69v124l-201-69Z" fill="#a7c1a7" />
    <path d="m313 82 187 64v109l-187-64Z" fill="url(#board)" />
    <g fill="#e4f8d5" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="20" transform="matrix(1,.34,0,1,333,121)"><text>CUIDAR TAMBÉM</text><text y="28">É APRENDER.</text></g>
    <path d="m336 190 106 36" stroke="#96c5a5" strokeWidth="2" strokeDasharray="5 4" />
    <path d="m303 203 205 70" stroke="#fff" strokeWidth="6" />
    <path d="m321 208 26 9" stroke="#f5d080" strokeWidth="5" />
    <g stroke="#1a5b50" strokeWidth="7" strokeLinecap="round"><path d="M176 297v57m74-42v65m51-104v52m68-24v55" /></g>
    <path d="m154 284 61-32 65 26-61 35Z" fill="#fcf6da" /><path d="m154 284 65 29 61-35v10l-61 35-65-30Z" fill="#b6a775" />
    <path d="m282 259 57-30 61 25-57 32Z" fill="#fcf6da" /><path d="m282 259 61 27 57-32v10l-57 31-61-26Z" fill="#b6a775" />
    <path d="m190 275 24-12 24 10-24 13Z" fill="#fff" /><path d="m202 277 16-8m-10 11 17-8" stroke="#9cc8b5" strokeWidth="2" />
    <path d="m317 251 20-10 22 9-21 11Z" fill="#9fceee" /><path d="m338 242 21 8" stroke="#628aa2" strokeWidth="2" />
    <g><path d="M111 272v-62" stroke="#397a51" strokeWidth="4" /><path d="M110 247c-30-1-32-21-29-26 23-3 32 13 29 26Z" fill="#3e9760" /><path d="M112 231c-1-26 12-33 22-30 2 19-7 28-22 30Z" fill="#72ad66" /><path d="m92 266 39 9-7 38-25-6Z" fill="#f4e4c3" /><path d="m92 266 39 9-5 7-33-9Z" fill="#d5c298" /></g>
    <g transform="translate(399 314)"><path d="m0 0 33-17 35 15-33 19Z" fill="#4e9cdb" /><path d="m3 4 32 14v52L9 58Z" fill="#2e78ab" /><path d="m35 18 30-17-5 57-25 12Z" fill="#4599ca" /><path d="m20 1 15-7 16 6-15 8Z" fill="#125a77" /><text x="13" y="37" fill="#fff" fontFamily="Inter" fontSize="12" transform="skewY(23)">PAPEL</text></g>
    <g transform="translate(464 340)"><path d="m0 0 30-16 33 14-30 18Z" fill="#f4d983" /><path d="m3 3 30 13v47L8 52Z" fill="#d7b657" /><path d="m33 16 28-16-5 51-23 12Z" fill="#e7c66d" /><path d="m18 0 15-7 14 6-15 8Z" fill="#98752f" /><path d="m13 31 10 5m-5-9-4 13m7-10-4 12" stroke="#fff9e3" strokeWidth="2" /></g>
    <g transform="translate(331 337)"><path d="m0 0 27-14 31 13-28 16Z" fill="#87bc9b" /><path d="m3 3 27 12v44L8 49Z" fill="#397a60" /><path d="m30 15 26-15-5 48-21 11Z" fill="#5b9c77" /><path d="m20 30 6 5-5 7m6-10 5 2-2 8" stroke="#e8f6d8" fill="none" strokeWidth="2" /></g>
    <path d="m276 59 0 161" stroke="#bed8c4" strokeWidth="2" />
    <circle cx="484" cy="63" r="31" fill="#c6ecb4" /><path d="m472 63 9 9 17-20" fill="none" stroke="#1d7259" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m40 186 5-13 5 13 13 5-13 5-5 13-5-13-13-5Z" fill="#73a993" /><circle cx="555" cy="260" r="5" fill="#81b7a0" />
  </svg>;
}
