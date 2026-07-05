export default {
  async fetch(request, env) {
    const ok = (b) => new Response(b, { headers: { "Content-Type": "text/html;charset=utf-8" } });
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
    const p = new URL(request.url).pathname;

    if (p === "/api/clips" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM clips ORDER BY posted_date DESC, id DESC").all();
      return json(results);
    }

    if (p === "/api/clips" && request.method === "POST") {
      const b = await request.json();
      if (!b.title || !b.title.trim()) return json({ error: "Title is required" }, 400);
      const result = await env.DB.prepare(
        `INSERT INTO clips (title, topic, posted_date, notes, link_x, link_youtube, link_instagram, link_tiktok, views_x, views_youtube, views_instagram, views_tiktok, reviewed, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(
        b.title.trim(), b.topic || "", b.posted_date || new Date().toISOString().slice(0, 10), b.notes || "",
        b.link_x || "", b.link_youtube || "", b.link_instagram || "", b.link_tiktok || "",
        b.views_x || 0, b.views_youtube || 0, b.views_instagram || 0, b.views_tiktok || 0, b.reviewed ? 1 : 0
      ).run();
      return json({ id: result.meta.last_row_id });
    }

    const clipMatch = p.match(/^\/api\/clips\/(\d+)$/);
    if (clipMatch && request.method === "PUT") {
      const id = clipMatch[1];
      const b = await request.json();
      if (!b.title || !b.title.trim()) return json({ error: "Title is required" }, 400);
      await env.DB.prepare(
        `UPDATE clips SET title=?, topic=?, posted_date=?, notes=?, link_x=?, link_youtube=?, link_instagram=?, link_tiktok=?,
         views_x=?, views_youtube=?, views_instagram=?, views_tiktok=?, reviewed=?, updated_at=datetime('now') WHERE id=?`
      ).bind(
        b.title.trim(), b.topic || "", b.posted_date || "", b.notes || "",
        b.link_x || "", b.link_youtube || "", b.link_instagram || "", b.link_tiktok || "",
        b.views_x || 0, b.views_youtube || 0, b.views_instagram || 0, b.views_tiktok || 0, b.reviewed ? 1 : 0, id
      ).run();
      return json({ ok: true });
    }

    if (clipMatch && request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM clips WHERE id=?").bind(clipMatch[1]).run();
      return json({ ok: true });
    }

    if (p === "/api/plans" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT id, title, episode_date, created_at, updated_at FROM plans ORDER BY updated_at DESC").all();
      return json(results);
    }

    if (p === "/api/plans" && request.method === "POST") {
      const b = await request.json();
      const result = await env.DB.prepare(
        `INSERT INTO plans (title, episode_date, content, updated_at) VALUES (?, ?, ?, datetime('now'))`
      ).bind(b.title || "Untitled Show Plan", b.episode_date || "", b.content || "").run();
      return json({ id: result.meta.last_row_id });
    }

    const planMatch = p.match(/^\/api\/plans\/(\d+)$/);
    if (planMatch && request.method === "GET") {
      const row = await env.DB.prepare("SELECT * FROM plans WHERE id=?").bind(planMatch[1]).first();
      if (!row) return json({ error: "Not found" }, 404);
      return json(row);
    }

    if (planMatch && request.method === "PUT") {
      const id = planMatch[1];
      const b = await request.json();
      await env.DB.prepare(
        `UPDATE plans SET title=?, episode_date=?, content=?, updated_at=datetime('now') WHERE id=?`
      ).bind(b.title || "Untitled Show Plan", b.episode_date || "", b.content || "", id).run();
      const row = await env.DB.prepare("SELECT updated_at FROM plans WHERE id=?").bind(id).first();
      return json({ ok: true, updated_at: row ? row.updated_at : null });
    }

    if (planMatch && request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM plans WHERE id=?").bind(planMatch[1]).run();
      return json({ ok: true });
    }

    if (p === "/clips") return ok(clipsPage());
    if (p === "/clubs") return ok(clubsPage());
    if (p === "/transfers") return ok(transfersPage());
    if (p === "/plan") return ok(planListPage());
    const planExportMatch = p.match(/^\/plan\/(\d+)\/export$/);
    if (planExportMatch) return ok(planExportPage(planExportMatch[1]));
    const planPageMatch = p.match(/^\/plan\/(\d+)$/);
    if (planPageMatch) return ok(planEditorPage(planPageMatch[1]));
    const m = p.match(/^\/club\/([a-z0-9-]+)$/);
    if (m) return ok(clubPage(m[1]));
    return ok(HOME);
  },
};

const CLUBS = {
/* === CHAMPIONSHIP === */
'coventry-city':{n:'Coventry City',a:'COV',c:'#0056A2',div:'Championship',city:'Coventry',founded:1883,nick:'The Sky Blues',ground:'CBS Arena',cap:32609,mgr:'Frank Lampard',owners:'Doug King',colours:'Sky blue & white',rivals:['Birmingham City','Aston Villa','Leicester City','Wolverhampton Wanderers'],honours:['FA Cup 1987','Second Division 1966-67','Third Division 1963-64','Third Division South 1935-36'],hi:'6th in First Division (1969-70)',lo:'League One (2012-13)',legends:['Steve Ogrizovic (601 apps — club record)','Clarrie Bourton (182 goals — all-time record)','Cyrille Regis','George Curtis','Dion Dublin','Gary McAllister','Willie Carr'],bio:'Coventry City are a West Midlands club best known for their sensational 1987 FA Cup triumph — their only major honour — when they defeated Tottenham Hotspur 3–2 in a classic Wembley final. The club spent a remarkable 34 consecutive seasons in the top flight (1967–2001), surviving multiple relegation scares. A stadium saga defined the 2010s as they groundshared away from Coventry. Doug King\'s full ownership from 2023 and Frank Lampard\'s 95-point Championship title in 2026 finally ended the long exile from the top flight.',history:['1883: Founded as Singers FC by bicycle factory workers','1898: Renamed Coventry City','1919: Voted out of Football League briefly; re-elected to newly-formed Third Division South','1936: Win Third Division South title','1967: Win Second Division; enter First Division for first time','1987: Win the FA Cup — beat Tottenham 3-2 at Wembley; the club\'s greatest day','1992: Founder members of the Premier League','2001: Relegated after 34 consecutive top-flight seasons','2013: Administration; relegated to League One; forced to groundshare in Birmingham','2023: FA Cup final as Championship club — lost 1-0 to Man United after extra time; Doug King takes full ownership','2026: Championship champions under Lampard with record 95pts — back in Premier League after 25 years']},
'ipswich-town':{n:'Ipswich Town',a:'IPS',c:'#0044A0',div:'Championship',city:'Ipswich',founded:1878,nick:'The Tractor Boys / The Blues',ground:'Portman Road',cap:30311,mgr:'Kieran McKenna',owners:'Gamechanger 20 Ltd (US consortium — Brett Johnson, Berke Bakay, Mark Detmer)',colours:'Blue & white',rivals:['Norwich City','Colchester United'],honours:['First Division 1961-62','FA Cup 1978','UEFA Cup 1981','Second Division 1960-61','Second Division 1967-68','Second Division 1991-92','Third Division South 1953-54','Third Division South 1956-57'],hi:'First Division Champions (1961-62)',lo:'League One (2019-21)',legends:['Mick Mills (741 apps — club record)','Ray Crawford (227 goals — all-time record)','Bobby Robson (manager)','Kevin Beattie','John Wark','Frans Thijssen','Arnold Mühren','Alan Brazil'],bio:'Ipswich Town\'s golden era under Sir Bobby Robson in the 1970s and early 1980s produced a league title, an FA Cup, and a remarkable UEFA Cup triumph that remains one of English football\'s proudest underdog stories. The club fell from those heights and spent years in the lower divisions before Kieran McKenna orchestrated one of the great modern managerial runs — League One to Premier League in three seasons. Portman Road is undergoing expansion, and after one season in the Premier League they bounced straight back as runners-up under McKenna again in 2026.',history:['1878: Founded as an amateur club','1938: Elected to the Football League (Third Division South)','1954: Win Third Division South — first league honour','1961: Win Second Division; join First Division','1962: Win First Division in only their second top-flight season — under Alf Ramsey','1963: Ramsey leaves to manage England; golden era winds down','1969: Bobby Robson appointed manager — begins the great era','1978: Win FA Cup, beating Arsenal 1-0 (Roger Osborne goal)','1981: Win UEFA Cup, beating AZ Alkmaar — one of English football\'s great underdog triumphs','1986: Relegated from top flight for first time','2019: Relegated to League One — lowest point in over 60 years','2021: Kieran McKenna appointed; extraordinary rebuild begins','2023: League One champions; promoted to Championship','2024: Championship runners-up; Premier League at last','2025: Relegated from Premier League after one season','2026: Championship runners-up again — immediate return to Premier League']},
'millwall':{n:'Millwall',a:'MIL',c:'#001489',div:'Championship',city:'London (Bermondsey)',founded:1885,nick:'The Lions',ground:'The Den',cap:20146,mgr:'Alex Neil',owners:'Berylson family (James Berylson, Chairman)',colours:'Navy blue & white',rivals:['West Ham United','Crystal Palace','Charlton Athletic','Brighton'],honours:['Second Division 1987-88','Third Division South 1927-28','Football League Trophy 1983'],hi:'10th in First Division (1988-89)',lo:'Fourth Division (1960s)',legends:['Barry Kitchener (596 apps — club record)','Neil Harris (138 goals — all-time record)','Harry Cripps','Teddy Sheringham','Tony Cascarino','Tim Cahill','Keith Peacock'],bio:'Millwall are one of English football\'s most singular clubs — a proudly working-class South London institution with a fierce, loyal fanbase and a reputation forged in the industrial docklands. They have never played in the Premier League despite being one of the Football League\'s long-standing clubs and reaching an FA Cup final in 2004. The Lions have ground out seasons in the Championship under a succession of honest managers; their atmosphere at The Den remains one of the most intimidating in the country.',history:['1885: Founded by workers at J.T. Morton\'s canning factory on the Isle of Dogs','1920: Elected to the Football League (Third Division)','1928: Win Third Division South — first major honour','1988: Win Second Division under John Docherty — reach First Division for first time','1989-90: Creditable First Division campaign before relegation','1993: Move to new The Den in Bermondsey (old Den was Cold Blow Lane)','1994-95: FA Cup semi-final run','2004: FA Cup final — lose 3-0 to Manchester United; greatest achievement','2009: FA Cup semi-final — lose to Everton','2017: Promoted back to Championship under Neil Harris','2020: FA Cup semi-final — lose to Leicester City','2026: Championship play-off semi-finalists — beaten by Hull 2-0 on aggregate']},
'southampton':{n:'Southampton',a:'SOU',c:'#D71920',div:'Championship',city:'Southampton',founded:1885,nick:'The Saints',ground:'St Mary\'s Stadium',cap:32384,mgr:'Tonda Eckert',owners:'Sport Republic (Rasmus Ankersen & Henrik Kraft)',colours:'Red & white stripes',rivals:['Portsmouth','Bournemouth'],honours:['FA Cup 1976','Second Division 1959-60','Third Division South 1921-22','Football League Trophy 2010'],hi:'2nd in First Division (1983-84)',lo:'League One (2009-11)',legends:['Terry Paine (808 apps — club record)','Mick Channon (228 goals — all-time record)','Matt Le Tissier (209 goals, one club career)','Alan Shearer','Kevin Keegan','Peter Shilton'],bio:'Southampton are defined above all by Matthew Le Tissier — a generational talent who chose loyalty over trophies and lit up St Mary\'s with extraordinary goals for one club his entire career — and their world-class academy which has produced Alan Shearer, Gareth Bale, Luke Shaw, Adam Lallana and Theo Walcott. The 1976 FA Cup win over Manchester United as a Second Division side remains their greatest trophy. A yo-yo between the Premier League and Championship defined the 2010s and 2020s, and the 2026 play-off campaign ended in the Spygate controversy when an analyst was caught filming Boro\'s training session and fled when confronted.',history:['1885: Founded as St Mary\'s Church of England Young Men\'s Association FC','1897: Renamed Southampton FC','1900, 1902: Reach FA Cup final (as Southern League club)','1922: Win Third Division South — first Football League honour','1960: Win Second Division; promoted to First Division','1976: Win FA Cup, beating Manchester United 1-0 as a Second Division side — Bobby Stokes goal','1984: Finish 2nd in First Division — best ever league finish under Lawrie McMenemy','2001: Move from The Dell to new St Mary\'s Stadium','2003-04: FA Cup final — lose to Arsenal; best PL-era cup run','2009: Relegated to League One; financial crisis','2012: Back-to-back promotions to Premier League under Pochettino & Adkins','2017: Highest PL finish (8th)','2024: Relegated again; Will Still then Tonda Eckert in charge','2026: Championship play-off semi-finalists; Spygate scandal — analyst films Boro training, flees when confronted']},
'middlesbrough':{n:'Middlesbrough',a:'MID',c:'#CC0000',div:'Championship',city:'Middlesbrough',founded:1876,nick:'Boro / The Smoggies',ground:'Riverside Stadium',cap:33746,mgr:'Kim Hellberg',owners:'Steve Gibson (Chairman)',colours:'Red & white',rivals:['Sunderland','Newcastle United','Leeds United'],honours:['League Cup 2004','Second Division 1926-27','Second Division 1928-29','Second Division 1973-74'],hi:'3rd in First Division (1913-14)',lo:'Third Division (1966-67 & 1985-86)',legends:['George Camsell','Wilf Mannion','Brian Clough (player)','Juninho','Fabrizio Ravanelli','Bernie Slaven','Tony Mowbray','Stewart Downing'],bio:'Middlesbrough\'s history is inextricably linked to Steve Gibson\'s remarkable stewardship — he saved the club from extinction in 1986 and bankrolled an extraordinary mid-1990s period when Brazilian legend Juninho and Italian star Fabrizio Ravanelli wore the Boro shirt. George Camsell scored 59 league goals in 1926-27, a Football League record. The 2004 League Cup final victory over Bolton remains their only major trophy, and a 2006 UEFA Cup final run showed their peak. Kim Hellberg\'s side were 2026 play-off semi-finalists, the victims of the Spygate scandal.',history:['1876: Founded','1889: Turn professional; join the Football League','1927: Win First Division (second tier) — George Camsell scores 59 league goals (Football League record)','1966: Relegated to Third Division — darkest era','1986: Near bankruptcy; Steve Gibson and consortium save the club','1995: Win First Division — promoted to Premier League; Juninho era begins','1996-97: Juninho, Ravanelli, Emerson — three Wembley finals, all lost; relegated despite it','2004: Win League Cup, beating Bolton Wanderers 2-1 — first and only major trophy','2006: Reach UEFA Cup final; lose 4-0 to Sevilla in one of the great European upsets','2009: Relegated from Premier League','2016: Back in Premier League under Aitor Karanka','2017: Relegated again; Championship ever since','2025-26: Rob Edwards then Kim Hellberg; play-off semi-final victims of Spygate']},
'hull-city':{n:'Hull City',a:'HUL',c:'#F5A12D',ck:true,div:'Championship',city:'Hull',founded:1904,nick:'The Tigers',ground:'MKM Stadium',cap:25400,mgr:'Sergej Jakirović',owners:'Acun Ilıcalı (Turkish media mogul)',colours:'Amber & black',rivals:['Leeds United','Sheffield United','Sheffield Wednesday','Barnsley'],honours:['FA Cup runners-up 2014','Third Division 1965-66','Third Division North 1932-33','Third Division North 1948-49'],hi:'16th in Premier League (2014-15)',lo:'League Two (2017-19)',legends:['Andy Davidson (579 apps — club record)','Chris Chilton (222 goals — all-time record)','Ken Wagstaff','Dean Windass','Nick Barmby','Jarrod Bowen'],bio:'Hull City spent most of their history in the lower divisions before a dramatic rise culminated in Premier League promotion for the first time in 2008, when Hull-born Dean Windass volleyed the most famous goal in their history in the Championship play-off final at Wembley. They reached the FA Cup final in 2014, leading Arsenal 2-0 before losing 3-2 in extra time. Under Acun Ilıcalı\'s ambitious ownership from 2022, Sergej Jakirović led them to the 2026 Championship play-off final, returning Hull to the Premier League.',history:['1904: Founded','1905: Join Football League (Second Division)','1949: Win Third Division North title','1966: Win Third Division — enter second tier for first time','1985: Enter Second Division; competitive era begins','2008: Championship play-off final at Wembley — Dean Windass volley sends Hull to Premier League for first time','2010: Relegated from Premier League','2013: Back in Premier League under Steve Bruce','2014: FA Cup final — lead Arsenal 2-0, lose 3-2 in extra time','2015: Relegated from Premier League again','2016: Championship play-off winners — Premier League again','2017: Relegated; enter a turbulent period','2019: Back in Championship','2022: Acun Ilıcalı completes takeover — ambitious investment begins','2026: Beat Millwall in Championship play-off semi-final; promoted to Premier League']},
'wrexham':{n:'Wrexham',a:'WRX',c:'#CC0000',div:'Championship',city:'Wrexham',founded:1864,nick:'The Red Dragons / The Robins',ground:'SToK Cae Ras (Racecourse Ground)',cap:15500,mgr:'Phil Parkinson',owners:'Ryan Reynolds & Rob McElhenney (co-owners, majority); Apollo Sports Capital (minority from Dec 2025)',colours:'Red & white',rivals:['Chester FC','Shrewsbury Town','Tranmere Rovers'],honours:['National League 2022-23','FA Trophy 1972, 1975','Welsh Cup 23 times (record)'],hi:'15th in Third Division (1977-78 — highest EFL finish)',lo:'National League (2008-2023)',legends:['Mickey Thomas','Arfon Griffiths','Joey Jones','Terry Yorath','Dean Saunders','Lee Jones','Paul Mullin'],bio:'Wrexham are the oldest international football team\'s national association predates FIFA — they are one of the oldest clubs in the world, and their Racecourse Ground hosted the first international still in active use. Their story has never been bigger than now: after 15 years in the National League, the purchase by Hollywood stars Ryan Reynolds and Rob McElhenney in 2021 sparked a global phenomenon through the Welcome to Wrexham documentary. Phil Parkinson delivered three consecutive promotions into the Championship, and a ground expansion is under way.',history:['1864: Founded — one of the oldest clubs in the world','1876: First international match at Racecourse Ground; first international venue still in use','1878: Co-founders of the Football Association of Wales','1975: Win FA Trophy — best cup achievement','1978: Reach European Cup Winners\' Cup quarter-finals','1992: Mickey Thomas free-kick eliminates Arsenal in FA Cup — iconic Welsh football moment','2008: Relegated from Football League; enter the Conference/National League','2021: Ryan Reynolds and Rob McElhenney complete takeover; Welcome to Wrexham begins filming','2023: National League champions — back in the Football League (League Two)','2024: League Two champions — promoted to League One','2025: League One champions — promoted to Championship; first time in the second tier in over 40 years','2026: 7th in Championship — final-day heartbreak, Hull pipped them for the last play-off place']},
'derby-county':{n:'Derby County',a:'DER',c:'#1C1C1C',div:'Championship',city:'Derby',founded:1884,nick:'The Rams',ground:'Pride Park Stadium',cap:33597,mgr:'John Eustace',owners:'David Clowes (Clowes Developments)',colours:'White & black',rivals:['Nottingham Forest','Leicester City','Leeds United','Sheffield United'],honours:['First Division 1971-72','First Division 1974-75','Second Division 1911-12','Second Division 1914-15','Second Division 1968-69','Second Division 1986-87','FA Cup 1946','Charity Shield 1975'],hi:'First Division Champions (1972 & 1975)',lo:'League One (2021-23)',legends:['Steve Bloomer','Brian Clough (manager)','Dave Mackay','Roy McFarland','Colin Todd','Kevin Hector','Igor Štimac','Stefano Eranio'],bio:'Derby County\'s story is shaped by two extraordinary figures. Steve Bloomer was the Victorian era\'s greatest goalscorer with 332 goals for Derby, and Brian Clough — though his Derby work is overshadowed by his Nottingham Forest legacy — won back-to-back First Division titles here in 1972 and 1975. The club\'s nadir came in 2021-22 when a -21 point deduction for financial irregularities was the largest in Football League history, sending them into League One. David Clowes\' rescue ownership and John Eustace\'s management has restored stability.',history:['1884: Founded by members of Derbyshire County Cricket Club, who shared County Ground','1888: Founder members of the Football League','1895-1898: Three FA Cup finals, no wins','1946: Win FA Cup — Raich Carter\'s finest hour; beat Charlton 4-1 after extra time','1952: Move to Baseball Ground','1969: Win Second Division; back in top flight','1972: Win First Division under Brian Clough — first league title','1975: Win First Division again under Dave Mackay','1991: Relegated from top flight; long mid-table Championship era begins','2007: Premier League under Billy Davies; relegated with record-low 11pts in 2007-08','2019: Championship play-off final — lose to Aston Villa; Frank Lampard\'s memorable season','2021: Administration; -21pt deduction — largest ever; relegated to League One','2022: David Clowes saves club from extinction','2024: Promoted back to Championship under Paul Warne','2025: John Eustace appointed after Warne sacked in February','2026: 8th in Championship (69pts)']},
'norwich-city':{n:'Norwich City',a:'NOR',c:'#00A650',div:'Championship',city:'Norwich',founded:1902,nick:'The Canaries',ground:'Carrow Road',cap:27359,mgr:'Philippe Clement',owners:'Mark Attanasio (majority, Norfolk Holdings)',colours:'Yellow & green',rivals:['Ipswich Town'],honours:['League Cup 1962','League Cup 1985','Second Division 1971-72','Second Division 1985-86','Third Division South 1933-34'],hi:'3rd in Premier League (1992-93)',lo:'League One (2009-10)',legends:['Grant Holt','Wes Hoolahan','Martin Peters','Robert Fleck','Jeremy Goss (1993 Bayern Munich volley)','Darren Huckerby','Chris Woods'],bio:'Norwich City are the embodiment of English football\'s yo-yo story — promoted to and relegated from the Premier League multiple times. Their finest hour came in 1992-93 when, in the inaugural Premier League season, they finished 3rd and spent time top of the league. Delia Smith\'s long ownership, characterised by famously passionate half-time appearances and genuine community spirit, defined the club for a generation before she handed majority control to Mark Attanasio\'s American consortium in 2024. Philippe Clement\'s appointment signals European structural ambition.',history:['1902: Founded','1934: Win Third Division South — first major honour','1962: Win League Cup as a Third Division club — shock achievement','1972: Win Second Division; promoted to First Division','1985: Win League Cup, beating Sunderland 1-0','1986: Win Second Division again; return to top flight','1992-93: Finish 3rd in inaugural Premier League season; reach UEFA Cup quarter-finals','1995: Relegated from Premier League; long oscillation begins','2011: Championship title under Paul Lambert with Grant Holt — best modern promotion','2019: Championship winners under Daniel Farke; Premier League','2020: Relegated from Premier League','2021: Championship winners again under Farke','2022: Relegated again after one season','2024: Delia Smith and Michael Wynn Jones hand control to Mark Attanasio consortium','2025: Philippe Clement appointed manager','2026: 9th in Championship — late-season collapse cost them a play-off place']},
'birmingham-city':{n:'Birmingham City',a:'BIR',c:'#2463AE',div:'Championship',city:'Birmingham',founded:1875,nick:'Blues / The Blues',ground:'St Andrew\'s @ Knighthead Park',cap:29409,mgr:'Chris Davies',owners:'Knighthead Capital Management (Tom Wagner & Nate Kleiman)',colours:'Royal blue & white',rivals:['Aston Villa','Wolverhampton Wanderers','West Brom','Coventry City'],honours:['League Cup 1963','League Cup 2011','Second Division 1892-93','Second Division 1920-21','Second Division 1947-48','Second Division 1954-55','Third Division 1994-95'],hi:'6th in First Division (best top-flight finish, 1950s)',lo:'League One (2019-21 & 2023-25)',legends:['Trevor Francis','Gil Merrick','Bob Latchford','Christophe Dugarry','Jude Bellingham','Barry Bridges','Stan Lynn'],bio:'Birmingham City are a club of considerable history and unfulfilled potential — a fanbase as large and passionate as any outside the Premier League but a club that has spent much of its recent history in the Championship or League One. Their history includes the League Cup in 1963 (the first League Cup ever contested), two Inter-Cities Fairs Cup finals, and the production of Trevor Francis, England\'s first million-pound player. Knighthead Capital\'s acquisition and Tom Wagner\'s ambitious plans — including the ground renaming and new stadium discussions — represent the most transformative ownership change in decades.',history:['1875: Founded as Small Heath Alliance','1888: Founder members of the Football League','1905: Renamed Birmingham City','1931: FA Cup final — lose to West Brom','1956: FA Cup final — lose to Manchester City','1960: Reach Inter-Cities Fairs Cup final (lose to Barcelona); then again 1961 (lose to Roma)','1963: Win League Cup — first ever League Cup, beat Aston Villa over two legs; only major trophy','1979: Trevor Francis sold to Nottingham Forest for £1m — first million-pound player in English football','2002: Back in top flight under Steve Bruce; consecutive Premier League seasons','2011: Win League Cup, beat Arsenal 2-1; relegated same season','2019: Relegated to League One for first time ever','2021: Knighthead Capital begin acquisition process','2023: Relegated to League One again under EFL financial pressure','2024: Win League One under Chris Davies; return to Championship','2025: Knighthead complete 100% takeover; ground renamed','2026: 14th in Championship — disappointing return after record League One title win']},
'swansea-city':{n:'Swansea City',a:'SWA',c:'#1C1C1C',div:'Championship',city:'Swansea',founded:1912,nick:'The Swans / The Jacks',ground:'Swansea.com Stadium',cap:20937,mgr:'Vítor Matos',owners:'Andy Coleman & group (inc. Luka Modrić minority stake)',colours:'White & black',rivals:['Cardiff City','Newport County'],honours:['League Cup 2013','Championship 2007-08','League One 2007-08'],hi:'8th in Premier League (2011-12)',lo:'League Two (2001-05)',legends:['Ivor Allchurch','John Charles (youth)','John Toshack (manager)','Lee Trundle','Leon Britton','Ashley Williams','Scott Sinclair','Wilfried Bony'],bio:'Swansea City\'s rise from near-extinction to Premier League and League Cup winners is one of the great modern football stories. The club almost folded in 2001 before fan ownership and Roberto Martínez saved them. John Toshack\'s management in the early 1980s briefly took them to the First Division, but their greatest years were under Brendan Rodgers and Michael Laudrup (2011-2014) when their passing football was admired across Europe. Vítor Matos — previously Jürgen Klopp\'s development coach at Liverpool — was appointed in November 2025.',history:['1912: Founded as Swansea Town','1920: Join Football League; renamed Swansea City in 1970','1978-82: John Toshack — four consecutive promotions; briefly in First Division (1981-83)','2001: Near extinction; financial collapse; drop to League Two — fan ownership saves the club','2003: Roberto Martínez appointed; rebuilding begins','2005: Win League Two','2008: Win League One title — promoted to Championship','2011: Win Championship play-off final under Brendan Rodgers — Premier League for the first time','2013: Win League Cup, beating Bradford City 5-0 — greatest ever trophy','2014-18: Stable Premier League years under Laudrup, Monk, others','2018: Relegated from Premier League','2021: Championship play-off final — lose to Brentford','2023: New ownership group including Luka Modrić acquires club','2025: Vítor Matos appointed after Alan Sheehan sacked','2026: Mid-table Championship finish under Vítor Matos']},
'bristol-city':{n:'Bristol City',a:'BCY',c:'#CC0000',div:'Championship',city:'Bristol',founded:1894,nick:'The Robins / City',ground:'Ashton Gate Stadium',cap:27000,mgr:'Michael Skubala',owners:'Stephen Lansdown CBE (since 1996)',colours:'Red & white',rivals:['Bristol Rovers','Cardiff City','Swansea City'],honours:['Second Division 1905-06','Third Division South 1922-23','Third Division South 1926-27','Third Division 1964-65','Football League Trophy 1986'],hi:'2nd in First Division (1906-07)',lo:'League Two (2012-13)',legends:['John Atyeo','Billy Wedlock','Brian Tinnion','Scott Murray','Leroy Lita','Paul Cheesley','Adeola Akinbiyi'],bio:'Bristol City are England\'s most southwesterly Championship regular, a club with a proud but largely trophy-less history anchored in their Ashton Gate home. John Atyeo is the club\'s defining figure — a schoolteacher and later club captain who scored 315 goals and refused all overtures from bigger clubs in an era when loyalty was everything. The club last played top-flight football in 1980 and narrowly avoided non-league in 2013 before Stephen Lansdown\'s sustained investment pulled them back. Michael Skubala arrives from Lincoln with Championship promotion pedigree.',history:['1894: Founded','1900: Elected to Football League','1906: Win Second Division; promoted to First Division','1907: Reach FA Cup final — lose to Sheffield United 1-0; best ever cup run','1911: Relegated from First Division — don\'t return for 65 years','1923, 1927: Win Third Division South twice','1965: Win Third Division','1976: Promoted to First Division; Alan Dicks era — briefly rub shoulders with the best','1980: Relegated from First Division; financial crisis follows','1982: Drop to Third Division','1986: Win Football League Trophy','2007: Win League One play-offs; return to Championship','2013: Drop to League Two — lowest point in 30 years','2015: Promoted back to Championship under Steve Cotterill','2018: FA Cup semi-final; Championship play-off semi-final — agonisingly close to Premier League','2026: 12th in Championship (62pts)']},
'sheffield-united':{n:'Sheffield United',a:'SHU',c:'#CC0000',div:'Championship',city:'Sheffield',founded:1889,nick:'The Blades',ground:'Bramall Lane',cap:32050,mgr:'Chris Wilder',owners:'COH Sports (Steven Rosen & Helmy Eltoukhy)',colours:'Red & white stripes',rivals:['Sheffield Wednesday'],honours:['First Division 1897-98','Second Division 1952-53','FA Cup 1899','FA Cup 1902','First Division (2nd tier) 1981-82','First Division (2nd tier) 2005-06','Championship 2018-19'],hi:'First Division Champions (1897-98)',lo:'Fourth Division (1981)',legends:['Tony Currie','Joe Shaw','Brian Deane','Keith Edwards','Alan Hodgkinson','Billy Sharp','Chris Wilder (manager)'],bio:'Sheffield United play at Bramall Lane — the world\'s oldest major football stadium still in use, where cricket and football have co-existed since 1855. They won the First Division in 1898 and the FA Cup twice in the Edwardian era. Their modern revival under Chris Wilder (first spell 2016-21) was extraordinary: League One title, Championship title, then a stunning 9th-place Premier League finish. After relegation and American ownership taking over from Saudi prince Abdullah, Wilder returned romantically in 2025.',history:['1889: Founded by Yorkshire County Cricket Club (who used Bramall Lane)','1892: Founder members of the Football League','1897-98: Win First Division — club\'s only top-flight title','1899: Win FA Cup','1902: Win FA Cup again','1981: Relegated to Fourth Division — darkest moment','1989: Rise from Fourth to First Division in three years under Dave Bassett — "Bassett\'s Blades"','1992: Founder members of the Premier League; Brian Deane scores the very first Premier League goal vs Man United','2006: Win First Division (second tier) under Neil Warnock; back in top flight','2016: Chris Wilder appointed; remarkable journey begins','2017: Win League One title','2019: Win Championship — promoted to Premier League','2020: Finish 9th in Premier League — one of the greatest over-achievements in PL history','2021: Relegated after catastrophic season (23pts); Wilder departs','2023: Back in Premier League; relegated again after one season','2024: Prince Abdullah sells to COH Sports (American ownership)','2025: Chris Wilder returns as manager — romantic second coming','2026: 13th in Championship (60pts)']},
'preston-north-end':{n:'Preston North End',a:'PNE',c:'#1B3A7A',div:'Championship',city:'Preston',founded:1880,nick:'The Lilywhites / PNE',ground:'Deepdale',cap:23404,mgr:'Paul Heckingbottom',owners:'Hemmings family',colours:'White & navy blue',rivals:['Blackburn Rovers','Burnley','Bolton Wanderers','Blackpool'],honours:['First Division 1888-89 (the Invincibles — unbeaten all season, first ever Double)','First Division 1889-90','Second Division 1903-04','Second Division 1912-13','Second Division 1950-51','FA Cup 1938','Third Division 1970-71'],hi:'First Division Champions (1889)',lo:'Third Division (1985-86)',legends:['Tom Finney (473 apps, 210 goals — both club records)','Bill Shankly','Alex James','David Healy'],bio:'Preston North End are the founding giants of English football. They were the very first Football League champions in 1888 and the immortal Invincibles in 1889 — the only team to win the league and FA Cup Double without losing a match. Tom Finney, widely considered one of England\'s greatest ever players, spent his entire career at Deepdale refusing huge offers from Juventus and other European giants. Despite this unmatched history, Preston have not played top-flight football since 1961.',history:['1880: Founded','1889: Win the very first Football League title (1888-89 season) — first champions in history','1889: The Invincibles — also win the FA Cup, becoming the first ever Double winners, unbeaten all season','1900-10: Decline; regular FA Cup semi-finalists in this era','1938: Win FA Cup — beat Huddersfield after extra time','1961: Last season in the top flight','1985: Drop to Third Division — lowest in modern history','1996: Back in Championship after long exile','2015: Back in Championship after League One period','2019: Championship play-off semi-finalists under Alex Neil','2026: 14th in Championship (60pts) under Paul Heckingbottom']},
'queens-park-rangers':{n:'Queens Park Rangers',a:'QPR',c:'#1B5CB5',div:'Championship',city:'London (West)',founded:1882,nick:'The Hoops / Rs',ground:'Loftus Road',cap:18439,mgr:'Julien Stephan',owners:'Lakshmi Mittal family (Amit Bhatia, chairman)',colours:'Blue & white hoops',rivals:['Brentford','Fulham','Chelsea'],honours:['League Cup 1967','Second Division 1982-83'],hi:'First Division runners-up (1975-76)',lo:'League One (2001-04)',legends:['Rodney Marsh','Stan Bowles','Gerry Francis','Les Ferdinand','Trevor Sinclair','Andy Sinton','Phil Parkes'],bio:'Queens Park Rangers are West London\'s most mercurial club — blessed with brilliant individual players across the decades but never quite sustaining success. Rodney Marsh and Stan Bowles defined the swaggering 1970s era under Dave Sexton, when QPR finished as First Division runners-up in 1976. A brief but lavishly funded Premier League stint in 2011-13 under Harry Redknapp (following investment from Lakshmi Mittal and Bernie Ecclestone) ended in chaotic relegation. Loftus Road remains an intimate, atmospheric old ground.',history:['1882: Founded; QPR is the world\'s most abbreviated club name','1920: Join the Football League','1967: Win League Cup — beat West Brom in two-legged final as a Third Division club; only major trophy','1976: First Division runners-up under Dave Sexton — best ever season','1979: Relegation; long rebuild','1983: Win Second Division — return to top flight','1988: Relegated from First Division','1992: Premier League founders','1995: Relegated from Premier League','2001: Drop to League One for first time','2011: Premier League under Harry Redknapp after Mittal/Ecclestone investment','2013: Relegated despite famous Mark Hughes era signings','2014: Back in Premier League','2015: Relegated again — bottom half of table','2026: 15th in Championship (58pts)']},
'watford':{n:'Watford',a:'WAT',c:'#FBEE23',ck:true,div:'Championship',city:'Watford',founded:1881,nick:'The Hornets',ground:'Vicarage Road',cap:21577,mgr:'Alessio Dionisi',owners:'Gino Pozzo (Hornets Investment Ltd / Pozzo family)',colours:'Yellow & black',rivals:['Luton Town'],honours:['First Division runners-up 1982-83','Second Division runners-up 1981-82','Third Division 1968-69','Fourth Division 1977-78','FA Cup runners-up 1984'],hi:'2nd in First Division (1982-83)',lo:'Fourth Division (1977)',legends:['Luther Blissett (503 apps & 186 goals — both club records)','John Barnes','Troy Deeney','Tommy Mooney','Abdoulaye Doucouré','Ian Bolton','Richard Johnson'],bio:'Elton John\'s club. Graham Taylor took Watford from the Fourth Division to the First in five remarkable years and the 1984 FA Cup final. John Barnes burst onto the national conscience here with his mesmerising solo goal against Brazil in 1984. The Pozzo family\'s ownership model — using Watford as the English base of a multi-club network spanning Udinese and Granada — turned them into a Premier League yo-yo club, cycling through managers at an extraordinary rate.',history:['1881: Founded','1920: Elected to Football League (Third Division South)','1969: Win Third Division under Ken Furphy','1977: Graham Taylor appointed as manager','1978: Win Fourth Division — start of Taylor\'s remarkable rise','1982: Second Division runners-up (behind Luton Town) — promoted to First Division in just four years from the Fourth','1983: Finish 2nd in the First Division, behind Liverpool — best ever league finish','1984: FA Cup final — lose to Everton 2-0; John Barnes goal vs Brazil same year becomes iconic','1987: Taylor leaves for Aston Villa; club declines into lower-mid table obscurity','2000: Relegated from Premier League (first time)','2006: Premier League again; relegated 2007','2007: Gino Pozzo and Hornets Investment Ltd take over — multi-club model begins (linking Udinese, Granada, Watford)','2015: Win Championship play-off final — Premier League under Quique Flores','2019: FA Cup final — lose to Manchester City 6-0; finish 11th in PL — best ever PL finish','2020: Relegated from Premier League for third time','2021: Win Championship under Xisco Munoz and then Claudio Ranieri — back in PL','2022: Relegated from Premier League for fourth time; manager chaos deepens','2025-26: Three managers (Pezzolano, then Gracia who resigned Feb 2026, then Ed Still sacked at season end); 16th in Championship']},
'stoke-city':{n:'Stoke City',a:'STK',c:'#CC0000',div:'Championship',city:'Stoke-on-Trent',founded:1863,nick:'The Potters',ground:'bet365 Stadium',cap:30089,mgr:'Mark Robins',owners:'Coates family (bet365 founders)',colours:'Red & white',rivals:['Port Vale'],honours:['League Cup 1972','Third Division North 1926-27'],hi:'9th in Premier League (2013-14)',lo:'Second Division (third tier, 1985)',legends:['Stanley Matthews','Gordon Banks','Jimmy Greenhoff','Peter Shilton','Tony Pulis (manager)','Ricardo Fuller','Rory Delap','Peter Crouch'],bio:'Stoke City are one of England\'s oldest clubs and home of Gordon Banks — widely considered the greatest goalkeeper in history, whose save from Pelé at the 1970 World Cup is called "the save of the century". Tony Pulis\' pragmatic but effective side with Rory Delap\'s iconic long throws became Premier League regulars from 2008-2018. Their FA Cup final defeat to Manchester City in 2011 remains the high watermark of their modern era. Relegation in 2018 began a difficult Championship spell.',history:['1863: Founded — one of the world\'s oldest football clubs','1888: Founder members of the Football League','1963: Relegated to Second Division; rebuilt under Tony Waddington','1972: Win League Cup — beat Chelsea 2-1; greatest post-war achievement','1977: Gordon Banks\' career ends after car accident','1985: Drop to Third Division (lowest ebb)','1992: Back in First Division / Premier League as founder member','2008: Promotion to Premier League under Tony Pulis — begin a decade at the top table','2010: Rory Delap throw-ins become a national talking point; FA Cup run','2011: FA Cup final — lose to Manchester City 1-0','2014: Finish 9th in Premier League — best ever top-flight finish','2018: Relegated from Premier League after a decade; long Championship rebuild begins','2026: 17th in Championship (55pts)']},
'portsmouth':{n:'Portsmouth',a:'POM',c:'#001489',div:'Championship',city:'Portsmouth',founded:1898,nick:'Pompey',ground:'Fratton Park',cap:20688,mgr:'John Mousinho',owners:'Michael Eisner (Tornante Company, majority)',colours:'Blue & white',rivals:['Southampton'],honours:['First Division 1948-49','First Division 1949-50','FA Cup 1939','FA Cup 2008'],hi:'First Division Champions (1949 & 1950)',lo:'League Two (2013-17)',legends:['Jimmy Dickinson (764 apps, never booked)','Alan Knight (683 apps)','Guy Whittingham (42 goals 1992-93)','Sol Campbell','Nwankwo Kanu','Alan Ball','Peter Crouch'],bio:'Portsmouth are a club defined by extremes — back-to-back First Division champions in 1949 and 1950 under Bob Jackson; FA Cup winners in 2008 under Harry Redknapp with a squad packed with Premier League stars; then a catastrophic collapse through four divisions in four years through financial mismanagement. Jimmy Dickinson remains the club\'s greatest player — he made 764 appearances for his only club and won 48 England caps, never receiving a yellow card.',history:['1898: Founded','1927: Reach FA Cup final — lose to Cardiff City (the only non-English club to win the FA Cup)','1939: Win FA Cup — beat Wolverhampton Wanderers 4-1','1949: Win First Division champions — peak era under Bob Jackson','1950: Win First Division again — back-to-back champions','1988: Relegated from First Division; long Championship era begins','2003: Back in Premier League under Harry Redknapp','2006: Qualify for UEFA Cup (10th in PL)','2008: Win FA Cup — beat Cardiff City 1-0 (Nwankwo Kanu goal); city-wide celebration','2010: Administration; relegated; points deductions begin a four-year collapse','2013: Drop to League Two — four divisions in four years','2013: Pompey Supporters Trust take ownership — remarkable fan-ownership story','2017: Win League Two — start of the climb back','2023: PST sell majority to Michael Eisner; climb to Championship','2024: Promoted to Championship — first time since 2012','2026: 18th in Championship (55pts)']},
'charlton-athletic':{n:'Charlton Athletic',a:'CHA',c:'#CC0000',div:'Championship',city:'London (Greenwich)',founded:1905,nick:'The Addicks',ground:'The Valley',cap:27111,mgr:'Nathan Jones',owners:'Global Football Partners',colours:'Red & white',rivals:['Millwall','Crystal Palace','Leyton Orient'],honours:['FA Cup 1947','First Division runners-up 1936-37'],hi:'7th in Premier League (1999-2000)',lo:'League One (2009-12 & 2016-19)',legends:['Sam Bartram (623 apps — club record)','Derek Hales (168 goals — all-time record)','Alan Curbishley (player & manager, 1991-2006)','Clive Mendonca (hat-trick, 1998 play-off final)','Mark Kinsella','Darren Bent'],bio:'Charlton Athletic are a South London club defined by two legendary stories. The first: their forced exile from The Valley in 1985 — sharing grounds with Crystal Palace and West Ham for seven years — followed by one of football\'s most emotional homecomings when 10,000 fans returned to rebuild the terracing and welcome the club back in December 1992. The second: Alan Curbishley\'s extraordinary tenure (1991-2006) which took them to the Premier League on a shoestring budget and kept them there for eight seasons.',history:['1905: Founded at The Valley','1935-38: First Division years — runners-up in 1937','1947: Win FA Cup — beat Burnley 1-0 after extra time; peak achievement','1957: Relegated from First Division; long lower-league era begins','1985: Ground dispute forces move; share with Crystal Palace then West Ham','1992: The Return to The Valley — one of football\'s great supporter-led achievements','1998: Premier League promotion under Alan Curbishley','2006: Curbishley resigns after 15 years; rapid decline follows','2007: Relegated from Premier League','2009: Drop to League One','2019: Return to Championship under Lee Bowyer','2020: Thomas Sandgaard completes takeover','2023: Global Football Partners (GFP) buy club — Sandgaard sells (later charged with unrelated fraud in the US)','2025: Nathan Jones leads Charlton back to Championship via play-off final (beat Leyton Orient 1-0)','2026: 19th in Championship — first season back in the second tier in 13 years']},
'blackburn-rovers':{n:'Blackburn Rovers',a:'BBR',c:'#009EE2',div:'Championship',city:'Blackburn',founded:1875,nick:'Rovers',ground:'Ewood Park',cap:31367,mgr:'Tony Mowbray',owners:'Venky\'s (Rao family)',colours:'Blue & white halves',rivals:['Burnley','Bolton','Preston'],honours:['Premier League 1994-95','FA Cup 1884','FA Cup 1928'],hi:'Premier League Champions (1995)',lo:'League One (2017)',legends:['Bob Crompton (~576 apps, 1896-1920 — club record)','Simon Garner (194 goals — all-time record)','Alan Shearer (34 goals in title season)','Chris Sutton','Colin Hendry','Tim Flowers'],bio:'Jack Walker bankrolled a Premier League title in 1995 — Alan Shearer and Chris Sutton\'s 49-goal partnership the most lethal in the division. Bob Crompton captained England 22 times and made approximately 576 appearances before WW1. Simon Garner scored 194 goals between 1978-1992, a club record that stands. The Venky\'s takeover in 2010 proved disastrous — sacking Sam Allardyce was just the start of a decade of mismanagement that took them to League One by 2017.',history:['1875: Founded','1884: FA Cup winners — beat Queen\'s Park (Scottish club) 2-1 at the Kennington Oval','1888: Founder members of the Football League','1928: FA Cup winners — beat Huddersfield 3-1','1995: Premier League champions — Alan Shearer (34 goals) & Chris Sutton; Jack Walker\'s millions','2010: Venky\'s takeover begins period of chaos','2012: Relegated from Premier League after Venky\'s sacked Allardyce mid-season','2017: Relegated to League One','2023: Back in Championship','2026: Finished 20th — survival secured by Michael O\'Neill (short-term); club now without a permanent manager']},
'west-brom':{n:'West Bromwich Albion',a:'WBA',c:'#003087',div:'Championship',city:'West Bromwich',founded:1878,nick:'The Baggies',ground:'The Hawthorns',cap:26852,mgr:'James Morrison',owners:'Shilen Patel (Bilkul Football Group, since 2023)',colours:'Blue & white stripes',rivals:['Aston Villa','Birmingham City','Wolverhampton'],honours:['First Division 1919-20','FA Cup 1888','FA Cup 1892','FA Cup 1931','FA Cup 1954','FA Cup 1968'],hi:'First Division Champions (1920)',lo:'Championship (current)',legends:['Tony Brown (279 goals & 720 apps — both club records)','Jeff Astle','Cyrille Regis','Laurie Cunningham','Brendan Batson','Bryan Robson','Ronnie Allen'],bio:'The Baggies from the Black Country. Jeff Astle\'s left-foot shot in extra time won the 1968 FA Cup — he scored in every round of that competition. Tony Brown holds both the club appearance (720) and goalscoring (279) records. The Three Degrees — Cyrille Regis, Brendan Batson, and Laurie Cunningham — were pioneers in Black British football in the late 1970s, challenging racism on the pitch at a time when it was rife on the terraces. Shilen Patel\'s 2023 takeover halted years of drift, with James Morrison — club legend — appointed manager in April 2026.',history:['1878: Founded','1888: FA Cup winners — first of three','1892: FA Cup winners again','1920: First Division champions — never been top-flight winners before or since','1968: FA Cup winners — Jeff Astle left-foot shot in extra time vs Everton (not a header, despite his heading reputation)','1978: The Three Degrees — Regis, Batson, Cunningham pioneer Black British football','2002: The Great Escape — 19th in PL on last day after 1-0 win; Robson legacy','2004: Premier League with 17 goals from Robert Earnshaw','2020: Back in Premier League under Slaven Bilic','2021: Relegated after 1 season','2023: Shilen Patel takes over from Guochuan Lai','2026: 30 April — James Morrison (former player, 341 apps) appointed on permanent 2yr contract; -2pt PSR deduction applied; finished 21st, survived by 4 points']},
'oxford-united':{n:'Oxford United',a:'OXF',c:'#F8BC00',ck:true,div:'League One',city:'Oxford',founded:1893,nick:'The U\'s',ground:'Kassam Stadium',cap:12500,mgr:'Matt Bloomfield',owners:'Tiger Thanakarnjanasuth',colours:'Yellow & black',rivals:['Swindon Town','Reading','MK Dons'],honours:['Second Division 1985','Third Division 1968','Fourth Division 1965','League Cup 1986'],hi:'First Division (1985-88)',lo:'Conference (2006-10)',legends:['Ron Atkinson (~560 apps as player, 1959-71 — club record)','John Aldridge (90 goals in 141 apps, 1984-87)','Jim Smith (manager, 1980-82)','Kevin Brock'],bio:'One of football\'s great rags-to-riches stories. Under Jim Smith and then Maurice Evans, Oxford rocketed from the Fourth Division to the First in four years in the early 1980s. The 1986 League Cup — beating QPR 3-0 — is the club\'s greatest day. Robert Maxwell\'s chaotic ownership inflated then crashed the club; his death in 1991 precipitated a financial collapse that eventually sent them to the Conference in 2006. The Kassam Stadium (cap 12,500) is the smallest in the Championship. Promoted again in 2024 under Des Buckingham after 24 years away.',history:['1893: Founded as Headington United','1960: Renamed Oxford United','1965: Win Fourth Division','1968: Win Third Division','1982: Jim Smith appointed — rapid rise begins','1985: Win Second Division — top flight for first time','1986: League Cup winners — beat QPR 3-0 at Wembley; club\'s greatest day','1988: Relegated from First Division','1991: Robert Maxwell dies; financial chaos begins','1996: Move to the Kassam Stadium (new ground)','2006: Relegated to the Conference','2010: Return to Football League','2024: Promoted to Championship — 24 years after relegation','2025: Gary Rowett appointed manager','2025: Dec — Rowett sacked after 50 games (28% win rate); Matt Bloomfield takes over in January','2026: Relegated to League One (22nd) — second-season syndrome; Kassam Stadium lease also expiring']},
'leicester-city':{n:'Leicester City',a:'LEI',c:'#003090',div:'League One',city:'Leicester',founded:1884,nick:'The Foxes',ground:'King Power Stadium',cap:32261,mgr:'Gary Rowett',owners:'Aiyawatt Srivaddhanaprabha (King Power Group)',colours:'Blue & white',rivals:['Nottingham Forest','Derby County','Coventry City'],honours:['Premier League 2015-16','FA Cup 2021','League Cup 1964','League Cup 1997','League Cup 2000'],hi:'Premier League Champions (2016)',lo:'League One (2026)',legends:['Arthur Chandler (273 goals 1923-35)','Gordon Banks','Gary Lineker','Peter Shilton','Kasper Schmeichel (479 apps)','Jamie Vardy','Riyad Mahrez'],bio:'The greatest underdog story in sporting history. 5,000-1 outsiders won the Premier League in 2016 under Claudio Ranieri — Vardy, Mahrez, Kante, Drinkwater. Arthur Chandler\'s 273 goals between 1923-35 remain the club record. Gordon Banks, one of the greatest goalkeepers of all time, spent his early career here. The cruel twist: a -6pt PSR deduction in 2025-26 sent them to League One just ten years after winning the title.',history:['1884: Founded as Leicester Fosse','1919: Renamed Leicester City','1949: First Division — highest finish at the time','1963: League Cup winners (inaugural)','1969: League Cup winners','1997: League Cup winners','1999: League Cup winners','2016: Premier League CHAMPIONS at 5000-1 — the greatest upset in football history','2017: Champions League last 16','2021: FA Cup winners — first in club history','2022: Relegated from Premier League','2023: Promoted back to Premier League','2024: Relegated again from Premier League','2025: Marti Cifuentes appointed July — sacked January 2026 after poor form; Gary Rowett takes over','2026: -6pts PSR deduction confirmed April; finished 23rd — relegated to League One for first time since 1980; from PL champions to League One in ten years']},
'sheffield-wednesday':{n:'Sheffield Wednesday',a:'SWE',c:'#0066B2',div:'League One',city:'Sheffield',founded:1867,nick:'The Owls',ground:'Hillsborough',cap:39732,mgr:'Henrik Pedersen',owners:'David Storch / Arise Capital Partners LLC (takeover completed 2 May 2026, replacing Chansiri)',colours:'Blue & white stripes',rivals:['Sheffield United'],honours:['First Division 1902-03','First Division 1903-04','First Division 1928-29','First Division 1929-30','FA Cup 1896','FA Cup 1907','FA Cup 1935'],hi:'First Division Champions (four times)',lo:'League One (2020)',legends:['Derek Dooley (63 goals in 63 apps — then leg amputated Feb 1953)','David Hirst (Guinness World Record: 114mph shot vs Arsenal, Sept 1996)','Chris Waddle','Di Canio','Mark Bright','Kevin Pressman'],bio:'One of England\'s most decorated and historic clubs. Four First Division titles, three FA Cups. Derek Dooley scored 63 goals in 63 appearances before his leg was amputated after a football injury in February 1953 — one of football\'s most tragic stories. David Hirst\'s 114mph thunderbolt against Arsenal in 1996 is a verified Guinness World Record for the fastest shot in English top-flight football. Hillsborough was the scene of the 1989 disaster in which 97 Liverpool supporters lost their lives. A -18pt deduction for financial breaches saw them relegated in February 2026 — the earliest Championship relegation ever recorded.',history:['1867: Founded as The Wednesday Cricket Club','1880: First football match played','1889: Founder members of Football League (Division 2)','1903: First Division champions','1904: First Division champions again — back-to-back','1929: First Division champions (third)','1930: First Division champions (fourth) — greatest era','1935: FA Cup winners — beat West Brom 4-2','1966: FA Cup final — lost to Everton 3-2 after leading 2-0','1989: Hillsborough Disaster — 97 Liverpool fans killed; tragedy defines the city','2000: Relegated from Premier League','2012: Back in Championship; financial mismanagement under Chansiri begins','2020: Relegated to League One','2023: Returned to Championship under Darren Moore','2026: -12pts (administration, Oct 2025) then -6pts (payment failure, Dec 2025) = -18pts total','2026: 22 February — relegated vs Sheffield United in Steel City derby; earliest EFL relegation on record','2026: Finished 24th (bottom). 2 May — David Storch / Arise Capital complete takeover; additional -15pt threat wiped on exit from administration']},
/* === LEAGUE ONE === */
'lincoln-city':{n:'Lincoln City',a:'LIN',c:'#CC0000',div:'Championship',city:'Lincoln',founded:1884,nick:'The Imps',ground:'LNER Stadium',cap:10000,mgr:'Chris Cohen & Tom Shaw (co-caretakers)',colours:'Red & white',rivals:['Grimsby','Peterborough','Boston United'],honours:['League One 2025-26 (103pts — record)','League Two 2018-19'],hi:'Championship (2026)',lo:'Conference (2011)',legends:['Grant Brown','Percy Freeman','Keith Alexander','John Schofield'],bio:'The Imps from Lincoln Cathedral city. Keith Alexander\'s resurrection took them back into the Football League in 2017 after six years in non-league. Michael Skubala took them to a stunning 103-point League One title in 2026 — Championship football for the first time since 1961.',history:['1884: Founded','1961: Last season in the second tier','2011: Relegated from Football League to Conference','2017: Back in the Football League as Conference champions','2019: League Two champions','2020: Reached League One play-offs','2026: League One champions with 103pts — Championship for first time since 1961']},
'cardiff-city':{n:'Cardiff City',a:'CAR',c:'#0070B5',div:'Championship',city:'Cardiff',founded:1899,nick:'The Bluebirds',ground:'Cardiff City Stadium',cap:33316,mgr:'Omer Riza',colours:'Blue & white',rivals:['Swansea City'],honours:['FA Cup 1927','Second Division 1920-21','Championship 2012-13'],hi:'Premier League (2013)',lo:'League One (2026)',legends:['Peter King','Phil Dwyer','Robert Earnshaw','Craig Bellamy'],bio:'The only non-English club to have won the FA Cup, beating Arsenal in 1927. Cardiff yo-yoed between the Championship and League One. Malaysian owner Vincent Tan controversially changed their blue kit to red in 2012 before reversing it. Automatic promotion in 2026 as runners-up.',history:['1899: Founded','1921: First Division (Division 2 winners)','1927: FA Cup — only non-English winners, beat Arsenal 1-0','2013: Premier League — under Malky Mackay, Vincent Tan era','2014: Relegated','2018: Back in Premier League','2019: Relegated again','2025: Relegated to League One','2026: League One runners-up, promoted back to Championship']},
'stockport-county':{n:'Stockport County',a:'SKC',c:'#0044A0',div:'League One',city:'Stockport',founded:1883,nick:'The Hatters',ground:'Edgeley Park',cap:10800,mgr:'Jimmy McNulty',colours:'Blue & white',rivals:['Oldham Athletic','Crewe Alexandra'],honours:['Third Division 1996-97'],hi:'First Division (1997)',lo:'Conference (2011)',legends:['Andy Thorpe','Kevin Francis','Brett Angell'],bio:'The original Hatters. Kevin Francis — the 6\'7" striker — became a cult hero in their rise to the First Division in the late 1990s. Fell to the Conference by 2011. Challinor\'s meticulous rebuild took them from non-league to League One play-offs in record time.',history:['1883: Founded','1997: First Division (second tier) — Kevin Francis era','2002: Relegated from First Division','2011: Relegated to Conference','2013: Back in Football League','2021: National League champions, promoted','2023: League Two champions, promoted to League One','2026: League One play-off semi-finalists']},
'bradford-city':{n:'Bradford City',a:'BRA',c:'#6C1D45',div:'League One',city:'Bradford',founded:1903,nick:'The Bantams',ground:'Valley Parade',cap:25136,mgr:'Graham Alexander',colours:'Claret & amber',rivals:['Leeds United','Huddersfield','Halifax'],honours:['FA Cup 1911'],hi:'First Division (1985)',lo:'League Two (2019)',legends:['Bobby Campbell','Stuart McCall','Dean Windass','Des Hamilton'],bio:'Bradford City carry the weight of the 1985 Valley Parade fire — 56 people died on the day they were celebrating winning the Third Division title. They reached the Premier League in 1999 and survived for two years. A club defined by tragedy and resilience.',history:['1903: Founded','1911: FA Cup winners','1985: Third Division champions on the day of the Valley Parade fire — 56 die','1999: Premier League for first time','2001: Relegated from Premier League after survival the year before','2007: Administration — almost fell out of existence','2013: League Cup final — beat Arsenal, Swansea, Aston Villa before losing to Swansea 5-0','2019: League Two','2026: League One play-off semi-finalists']},
'bolton-wanderers':{n:'Bolton Wanderers',a:'BOL',c:'#1C3A8A',div:'Championship',city:'Bolton',founded:1874,nick:'The Trotters',ground:'Toughsheet Community Stadium',cap:28723,mgr:'Ian Evatt',colours:'White & navy',rivals:['Burnley','Wigan','Blackburn'],honours:['FA Cup 1923','FA Cup 1926','FA Cup 1929','FA Cup 1958'],hi:'Premier League (2001)',lo:'League Two (2019)',legends:['Nat Lofthouse','Fabrice Muamba','Jay-Jay Okocha','Kevin Davies','Ivan Campo'],bio:'Nat Lofthouse\'s club. Four FA Cup wins. Jay-Jay Okocha made them a spectacle in the early 2000s. Fabrice Muamba\'s cardiac arrest at White Hart Lane in 2012 shocked the world. Financial collapse sent them to League Two. Ian Evatt\'s rebuild has been remarkable.',history:['1874: Founded','1958: FA Cup winners (fourth time) — Nat Lofthouse era','1978: Return to top flight','1995: Relegated from Premier League','2001: Sam Allardyce — Premier League with limited resources','2007: UEFA Cup under Allardyce','2012: Muamba cardiac arrest — survived miraculously','2019: League Two — financial meltdown','2023: Ian Evatt gets them to League One','2026: League One play-off winners — beat Stockport County 4-1 at Wembley; promoted to Championship']},
'stevenage':{n:'Stevenage',a:'STG',c:'#CC0000',div:'League One',city:'Stevenage',founded:1976,nick:'Boro',ground:'Lamex Stadium',cap:7800,mgr:'Steve Evans',colours:'Red & white',rivals:['Luton Town','Peterborough'],honours:['Conference 1995-96','Conference 2009-10','League Two 2022-23'],hi:'League One (2012)',lo:'Conference (2010)',legends:['Barry Hayles','Mark Robson'],bio:'Stevenage punched above their weight famously — beating Swindon 3-0 as a non-league side in the FA Cup in 1998, and being denied promotion to the Football League in 1996 due to ground issues. Rapid rise under Steve Evans reached League One play-offs in 2026.',history:['1976: Founded (reformed from Stevenage Athletic)','1996: Conference champions but denied FL promotion on ground grading','1998: Beat Swindon 3-0 as non-league club in FA Cup — iconic','2010: Conference champions — Football League at last','2023: League Two champions — back in League One','2026: League One play-off semi-finalists']},
'luton-town':{n:'Luton Town',a:'LUT',c:'#F87521',div:'League One',city:'Luton',founded:1885,nick:'The Hatters',ground:'Kenilworth Road',cap:10356,mgr:'Jack Wilshere',colours:'Orange & white',rivals:['Watford','MK Dons'],honours:['Second Division 1981-82'],hi:'Premier League (2023)',lo:'Conference (2009)',legends:['Brian Stein','Mick Harford','Kerry Dixon','Carlton Palmer'],bio:'The Hatters from Kenilworth Road. Historic old-fashioned ground. Made it to the Premier League in 2023 from the Conference in 2009 — one of football\'s greatest survival stories. Rob Edwards kept them competitive. Stayed up by one point on the final day.',history:['1885: Founded','1982: Second Division champions','1988: League Cup winners (beat Arsenal)','2007: Administration — relegated to Conference','2009: Conference','2014: Back in League One','2019: Championship','2023: Premier League — incredible story','2024: Relegated','2026: 7th in League One']},
'plymouth-argyle':{n:'Plymouth Argyle',a:'PLY',c:'#007B3C',div:'League One',city:'Plymouth',founded:1886,nick:'The Pilgrims',ground:'Home Park',cap:18600,mgr:'Wayne Rooney',colours:'Green & white',rivals:['Exeter City','Torquay'],honours:['League One 2022-23'],hi:'Championship (2023)',lo:'League Two (2011)',legends:['Tommy Tynan','Kevin Hodges','Romain Larrieu'],bio:'The most remote club in the English Football League. A city of 250,000 with no near rivals — Plymouth\'s fans travel the furthest of any FL club. Wayne Rooney took over as manager in 2024. League One champions in 2023.',history:['1886: Founded','1986: Second Division — highest league position','2011: League Two','2019: League Two — Wayne Rooney takes charge in 2024','2023: League One champions, promoted to Championship','2024: Relegated to League One','2026: 8th in League One']},
'huddersfield-town':{n:'Huddersfield Town',a:'HUD',c:'#0066B2',div:'League One',city:'Huddersfield',founded:1908,nick:'The Terriers',ground:'John Smith\'s Stadium',cap:24500,mgr:'Martin Drury',colours:'Blue & white stripes',rivals:['Bradford City','Leeds','Barnsley'],honours:['First Division 1923-24','First Division 1924-25','First Division 1925-26'],hi:'First Division Champions (1926)',lo:'League Two (2012)',legends:['Herbert Chapman','Rodney Marsh','Andy Booth','Marcus Stewart'],bio:'Three consecutive First Division titles in the 1920s under Herbert Chapman, who then repeated the feat at Arsenal. Huddersfield had perhaps the greatest dynasty in English football history. John Smith\'s Stadium was a template for modern grounds.',history:['1908: Founded','1924-26: Three consecutive First Division titles under Herbert Chapman','1970: FA Cup final — lost to Chelsea','2012: League Two','2017: Premier League for first time — play-off winners','2019: Relegated from Premier League','2023: Play-off final — lost to Luton','2026: 9th in League One']},
'mansfield-town':{n:'Mansfield Town',a:'MFD',c:'#F8BC00',ck:true,div:'League One',city:'Mansfield',founded:1897,nick:'The Stags',ground:'One Call Stadium',cap:10000,mgr:'Nigel Clough',colours:'Amber & blue',rivals:['Notts County','Nottingham Forest (area)'],honours:['League Two 2018-19'],hi:'Second Division (1977)',lo:'Conference (2008)',legends:['Ted Harston','Sandy Pate','Nigel Clough legacy'],bio:'Nigel Clough — son of Brian — has built Mansfield into League One regulars from the Conference. Amber-and-blue colours. Mining town club with passionate support.',history:['1897: Founded','1977: Third Division (old Third) — highest ever finish','2008: Conference','2013: Back in Football League','2019: League Two champions','2026: 10th in League One']},
'wycombe-wanderers':{n:'Wycombe Wanderers',a:'WYC',c:'#1C2D67',div:'League One',city:'High Wycombe',founded:1887,nick:'The Chairboys',ground:'Adams Park',cap:10000,mgr:'Matt Bloomfield',colours:'Light & dark blue quarters',rivals:['Oxford United','Reading'],honours:['FA Amateur Cup 1931'],hi:'Championship (2020)',lo:'Conference (1993)',legends:['Keith Scott','Dave Carroll','Adebayo Akinfenwa'],bio:'Chairboys from Adams Park. Gareth Ainsworth and Adebayo Akinfenwa became cult figures. Made it to the Championship in 2020 as League One play-off winners. Akinfenwa — the World\'s Strongest Footballer — scored in the Wembley final.',history:['1887: Founded','1993: Entered Football League','2001: FA Trophy winners','2020: Championship — first ever, play-off winners','2021: Relegated to League One','2026: 11th in League One']},
'reading':{n:'Reading',a:'REA',c:'#004494',div:'League One',city:'Reading',founded:1871,nick:'The Royals',ground:'Select Car Leasing Stadium',cap:24161,mgr:'Noel Hunt',colours:'Blue & white hoops',rivals:['Oxford United','Swindon'],honours:['Second Division 2005-06','Championship 2005-06'],hi:'Premier League (2006)',lo:'League One (2023)',legends:['Kevin Dillon','Steve Death','Dave Kitson','Kevin Doyle','Leroy Lita'],bio:'The Royals from the Select Car Leasing Stadium. Steve Coppell\'s 106-point Championship winners in 2006 still hold the record. Then a catastrophic descent through financial chaos, points deductions and mismanagement.',history:['1871: Founded — one of England\'s oldest clubs','2006: Championship record — 106pts, Premier League','2012: Play-off final — lost to Swansea','2013: Relegated from Premier League','2021: -6pt deduction, survived relegation','2022: -6pt deduction again','2023: League One — administration looms','2026: 12th in League One — still recovering']},
'blackpool':{n:'Blackpool',a:'BPL',c:'#F68712',div:'League One',city:'Blackpool',founded:1887,nick:'The Seasiders',ground:'Bloomfield Road',cap:16750,mgr:'Steve Bruce',colours:'Tangerine & white',rivals:['Preston','Burnley'],honours:['FA Cup 1953'],hi:'Premier League (2010)',lo:'League Two (2014)',legends:['Stanley Matthews','Jimmy Armfield','Jimmy Hampson','Charlie Adam'],bio:'Stanley Matthews\' club. The Wizard of Dribble played here and his 1953 FA Cup run is one of football\'s great stories. Charlie Adam\'s passing took them to the Premier League in 2010. Ownership chaos then destroyed them.',history:['1887: Founded','1953: FA Cup winners — the Matthews Final, beat Bolton 4-3','1971: First Division','2010: Premier League — Charlie Adam & Ian Holloway era','2012: Relegated from PL','2014: League Two — Oyston ownership chaos','2019: New ownership, rebuilding','2026: 13th in League One']},
'doncaster-rovers':{n:'Doncaster Rovers',a:'DON',c:'#CC0000',div:'League One',city:'Doncaster',founded:1879,nick:'Rovers',ground:'Eco-Power Stadium',cap:15231,mgr:'Grant McCann',colours:'Red & white',rivals:['Barnsley','Sheffield Wednesday','Rotherham'],honours:['Third Division North 1934-35','Third Division North 1946-47','League Two 2012-13'],hi:'Second Division (1998)',lo:'Conference (2003)',legends:['Harry Gregg','Alick Jeffrey','Glynn Snodin'],bio:'Mining town club with a proud history. Harry Gregg played here before Man Utd and Munich. Fell to the Conference in 2003, recovered. Grant McCann\'s era has been solid League One football.',history:['1879: Founded','1998: Second Division — highest finish','2003: Relegated to Conference','2006: Back in Football League','2013: League Two champions','2026: 14th in League One']},
'barnsley':{n:'Barnsley',a:'BAR',c:'#CC0000',div:'League One',city:'Barnsley',founded:1887,nick:'The Tykes',ground:'Oakwell',cap:23287,mgr:'Daniel Stendel',colours:'Red & white',rivals:['Sheffield Wednesday','Rotherham','Leeds'],honours:['Second Division 1911-12','FA Cup 1912'],hi:'Premier League (1997)',lo:'League One (multiple)',legends:['Danny Wilson','Jan Aage Fjortoft','Neil Redfearn','Macauley Bonne'],bio:'Tykes from Oakwell in South Yorkshire. Surprising Premier League season in 1997-98 under Danny Wilson. Marcelo Bielsa briefly managed here before Leeds. A club that punches above its weight in spirit.',history:['1887: Founded','1912: FA Cup winners','1997: Premier League — only ever top-flight season; Danny Wilson era','2014: Championship','2019: Championship play-offs','2021: Championship play-off final — lost to Swansea','2026: 15th in League One']},
'wigan-athletic':{n:'Wigan Athletic',a:'WIG',c:'#1C5AB7',div:'League One',city:'Wigan',founded:1932,nick:'The Latics',ground:'DW Stadium',cap:25138,mgr:'Gary Caldwell',colours:'Blue & white',rivals:['Burnley','Preston','Bolton'],honours:['FA Cup 2013','League One 2002-03'],hi:'Premier League (2005)',lo:'League One (2020)',legends:['Jimmy Bullard','Henri Camara','Emile Heskey','Ben Watson'],bio:'DW Stadium\'s finest. League One winners in 2003, then remarkable Premier League journey under Paul Jewell. FA Cup winners in 2013 — Ben Watson\'s header beat Man City — then relegated SAME DAY. Twice entered administration.',history:['1932: Founded','2003: League One champions — rapid rise begins','2005: Premier League under Paul Jewell','2008: Relegated from Premier League','2011: Back in Premier League','2013: FA Cup winners — beat Man City; relegated same day','2020: Administration for second time','2023: Back in League One','2026: 16th in League One']},
'burton-albion':{n:'Burton Albion',a:'BUR',c:'#F8BC00',ck:true,div:'League One',city:'Burton upon Trent',founded:1950,nick:'The Brewers',ground:'Pirelli Stadium',cap:6912,mgr:'Mark Robins',colours:'Yellow & black',rivals:['Derby County','Nottingham Forest (area)'],honours:['Conference 2008-09'],hi:'Championship (2016)',lo:'Conference (2003)',legends:['Nigel Clough','Lee Hennessey'],bio:'The Brewers from the brewing capital of England. Nigel Clough guided them from the Conference to the Championship in seven years. Punched well above their weight in the second tier with a tiny ground.',history:['1950: Founded (reformed)','2009: Conference champions — Football League entry','2015: League One champions','2016: Championship for first time','2017: Relegated to League One','2020: Relegated to League Two','2023: Back in League One','2026: 17th in League One']},
'peterborough-united':{n:'Peterborough United',a:'PBO',c:'#0044A0',div:'League One',city:'Peterborough',founded:1934,nick:'The Posh',ground:'Weston Homes Stadium',cap:15314,mgr:'Darren Ferguson',colours:'Blue & white',rivals:['Cambridge United','Northampton','Lincoln'],honours:['League Two 2007-08'],hi:'Championship (2011)',lo:'League Two (2009)',legends:['Tommy Robson','Robbie Cooke','Craig Mackail-Smith','Britt Assombalonga'],bio:'The Posh from Peterborough. Darren Ferguson (son of Sir Alex) has managed them three separate times. High-scoring, expansive football. Regularly yo-yo between League One and Championship.',history:['1934: Founded','2008: League Two champions','2011: Championship','2013: Relegated to League One','2021: Championship — Fergie Jr again','2022: Relegated to League One','2026: 18th in League One']},
'afc-wimbledon':{n:'AFC Wimbledon',a:'WIM',c:'#0044A0',div:'League One',city:'London (Wimbledon)',founded:2002,nick:'The Dons',ground:'Plough Lane',cap:9315,mgr:'Johnnie Jackson',colours:'Blue & yellow',rivals:['MK Dons'],honours:['Non-League titles (multiple)'],hi:'League One (2016)',lo:'Non-League (2002 — foundation)',legends:['Terry Eames','Kevin Cooper','Wes Fogden'],bio:'Born from protest. When Wimbledon FC was controversially moved to Milton Keynes in 2002, fans formed AFC Wimbledon from scratch in the Combined Counties League. They rose through nine divisions in nine years to League Two. The Plough Lane return in 2020 was a landmark moment.',history:['2002: Founded by fans after Wimbledon FC relocated to MK','2011: Football League — nine promotions in nine years','2016: League One — first time at fourth tier or above','2020: Return to Plough Lane — came home','2026: 19th in League One']},
'leyton-orient':{n:'Leyton Orient',a:'LEY',c:'#CC0000',div:'League One',city:'London (Leyton)',founded:1881,nick:'The O\'s',ground:'Brisbane Road',cap:9400,mgr:'Richie Wellens',colours:'Red & white',rivals:['Charlton','Millwall','Barnet'],honours:['Third Division South 1955-56'],hi:'Second Division (1962)',lo:'Conference (2017)',legends:['Tommy Johnston','John Chiedozie','Glenn Roeder'],bio:'The O\'s from Brisbane Road. East London\'s oldest football club. Fell to the Conference in 2017 after years of financial instability. Francesco Becchetti\'s chaotic ownership was a low point. Rebuilt and made League One.',history:['1881: Founded as Eagle FC','1962: Second Division — highest ever finish','1978: FA Cup semi-finalists','2017: Conference — relegated after Becchetti\'s chaotic ownership','2019: Back in League Two','2023: League Two champions, promoted to League One','2026: 20th in League One']},
'exeter-city':{n:'Exeter City',a:'EXE',c:'#CC0000',div:'League One',city:'Exeter',founded:1904,nick:'The Grecians',ground:'St James Park',cap:8541,mgr:'Matt Taylor',colours:'Red & white',rivals:['Plymouth Argyle','Torquay'],honours:['League Two 2021-22'],hi:'Second Division (1931)',lo:'Conference (2002)',legends:['Dick Pym','Mike Trebilcock','Darran Lcott','Matt Jay'],bio:'The Grecians from the cathedral city. Fan-owned since 2003. Drew with Brazil\'s national team on a 1914 tour. Gary Caldwell\'s football philosophy brought them to League One.',history:['1904: Founded','1914: Drew with Brazil national team on tour','1931: Second Division — highest ever','2002: Conference','2008: Back in Football League','2022: League Two champions','2023: League One','2026: 21st in League One']},
'port-vale':{n:'Port Vale',a:'PVA',c:'#1C1C1C',div:'League Two',city:'Stoke-on-Trent (Burslem)',founded:1876,nick:'The Valiants',ground:'Vale Park',cap:19052,colours:'Black & white',rivals:['Stoke City'],honours:['Third Division North 1929-30','Third Division North 1953-54'],hi:'Second Division (1954)',lo:'League Two (2017)',legends:['Stan Collymore','Gareth Ainsworth','Mark Grew'],bio:'Stoke-on-Trent\'s other club. The Valiants from Vale Park. Share a city with Stoke City but have their own fierce identity. Stan Collymore and Gareth Ainsworth both had notable spells here.',history:['1876: Founded','1954: Second Division — highest finish','1992: Conference','1994: Third Division champions under John Rudge','2013: League One','2017: Administration, League Two','2021: Back in League One','2026: Relegated to League Two']},
'rotherham-united':{n:'Rotherham United',a:'ROT',c:'#CC0000',div:'League Two',city:'Rotherham',founded:1925,nick:'The Millers',ground:'AESSEAL New York Stadium',cap:12021,colours:'Red & white',rivals:['Sheffield Wednesday','Sheffield United','Barnsley'],honours:['Third Division North 1950-51'],hi:'Championship (2014)',lo:'League Two (2003)',legends:['Danny Williams','Ronnie Moore','Will Grigg'],bio:'The Millers from South Yorkshire. New York Stadium opened in 2012 — a modern ground in an old steel town. Had two Championship seasons in the mid-2010s. Relegated from League One in 2026 after a brutal season.',history:['1925: Founded (merger of two local clubs)','2014: Championship under Steve Evans','2017: Back in Championship','2022: Championship again','2024: Relegated to League One','2026: Relegated to League Two']},
'northampton-town':{n:'Northampton Town',a:'NTN',c:'#A50026',div:'League Two',city:'Northampton',founded:1897,nick:'The Cobblers',ground:'Sixfields Stadium',cap:7798,colours:'Claret & white',rivals:['Peterborough','MK Dons'],honours:['Third Division 1962-63'],hi:'First Division (1965)',lo:'Conference (1994)',legends:['Joe Mercer','Obie Trice... Brian Borrows'],bio:'The Cobblers. Remarkably reached the First Division in 1965 from the Fourth Division — then fell back to the Fourth three years later. One of football\'s great rises and falls. Just 9 wins in 2025-26 saw them relegated to League Two.',history:['1897: Founded','1965: First Division — rose from Fourth in three years','1969: Back in the Fourth Division — fell three divisions in four years','1994: Conference','2016: League One','2020: League Two','2023: Promoted back to League One','2026: Relegated to League Two — just 9 wins all season']},
/* === LEAGUE TWO === */
'bromley':{n:'Bromley FC',a:'BRO',c:'#CC0000',div:'League One',city:'Bromley (South London)',founded:1883,nick:'The Ravens',ground:'Hayes Lane',cap:5000,mgr:'Andy Woodman',colours:'Red & white',rivals:['Maidstone','Dulwich Hamlet'],honours:['League Two 2025-26','National League 2023-24'],hi:'League One (2026)',lo:'Non-League (most of history)',legends:['Louis Dennis','Michael Cheek'],bio:'Founded 1883, Bromley have spent most of their 140-year existence in non-league football. Andy Woodman built an extraordinary side that won the National League in 2024 and League Two in 2026 with 87 points. League One football for the first time in their history.',history:['1883: Founded','2024: National League champions — Football League entry','2025: League Two — established themselves quickly','2026: League Two champions (87pts) — League One for first time in 143 years']},
'mk-dons':{n:'MK Dons',a:'MKD',c:'#CC0000',div:'League One',city:'Milton Keynes',founded:2004,nick:'The Dons',ground:'Stadium MK',cap:30500,mgr:'Scott Lindsey',colours:'White & red',rivals:['AFC Wimbledon','Luton'],honours:['League Two 2007-08','League One 2019-20'],hi:'Championship (2015)',lo:'League Two (2019)',legends:['Dean Lewington','Carlos Sánchez'],bio:'Controversial club formed when Wimbledon FC relocated to Milton Keynes in 2004. The move was condemned by supporters across football. But they have built their own identity — Stadium MK is one of the biggest outside the top four tiers. League Two runners-up in 2026.',history:['2004: Formed from relocated Wimbledon FC','2008: League Two champions','2015: Championship under Karl Robinson','2019: League Two again','2020: League One champions','2024: Relegated to League Two','2026: League Two runners-up, promoted']},
'cambridge-united':{n:'Cambridge United',a:'CAM',c:'#F8BC00',ck:true,div:'League One',city:'Cambridge',founded:1912,nick:'The U\'s',ground:'Abbey Stadium',cap:8127,mgr:'Mark Bonner',colours:'Amber & black',rivals:['Peterborough','Luton','MK Dons'],honours:['League Two 2020-21'],hi:'Second Division (1992)',lo:'Conference (2014)',legends:['Dion Dublin','John Taylor','Ian Ashbee'],bio:'The U\'s from Abbey Stadium. Dion Dublin started his career here before Manchester United bought him. Fell to the Conference in 2014. Mark Bonner\'s era has been brilliant — League Two champions in 2021, relegated back in 2025, straight back up in 2026.',history:['1912: Founded','1992: Second Division — highest ever, won on final day','2005: Relegated from Football League','2014: Conference','2014: Back in Football League','2021: League Two champions','2022: League One','2025: Relegated to League Two','2026: 3rd — automatic promotion back']},
'salford-city':{n:'Salford City',a:'SAL',c:'#CC0000',div:'League Two',city:'Salford',founded:1940,nick:'The Ammies',ground:'Peninsula Stadium',cap:5400,mgr:'Vacant (Robinson sacked 2 Jun 2026)',owners:'Class of 92 (Giggs, Scholes, Neville, Butt, G.Neville) + Singapore investors',colours:'Red & white',rivals:['FC United','Bury'],honours:['National League North 2018-19'],hi:'League Two (2026)',lo:'Non-League (before 2019)',legends:['Richie Allen','Chris Lynch'],bio:'The celebrity football experiment. The Class of 92 — Gary and Phil Neville, Paul Scholes, Nicky Butt, Ryan Giggs — invested in a small Salford club. Netflix documentary. Rose from non-league to League Two in five years. Karl Robinson in 2026 play-offs.',history:['1940: Founded','2014: Class of 92 invest','2019: National League North champions — Football League entry','2020: League Two','2026: League Two play-off semi-finalists']},
'notts-county':{n:'Notts County',a:'NTM',c:'#1C1C1C',div:'League One',city:'Nottingham',founded:1862,nick:'The Magpies',ground:'Meadow Lane',cap:20229,mgr:'Stuart Maynard',colours:'Black & white stripes',rivals:['Nottingham Forest','Mansfield'],honours:['FA Cup 1894','Fourth Division 1970-71','Third Division 1997-98'],hi:'First Division (1923)',lo:'Non-League (2019)',legends:['Don Masson','Tommy Lawton','Les Bradd'],bio:'The world\'s oldest professional football club, founded in 1862. Their black and white stripes directly inspired Juventus\' kit. Tommy Lawton stunned the world by moving here from Chelsea in 1947. Fell to non-league in 2019 — now rebuilding.',history:['1862: Founded — oldest professional club in the world','1894: FA Cup winners','1923: First Division','1947: Tommy Lawton joins from Chelsea — stuns football world','2019: Relegated from Football League to National League','2021: Back in Football League','2023: League One','2025: Relegated to League Two','2026: League Two play-off winners — beat Salford City 3-0 at Wembley, promoted to League One']},
'chesterfield':{n:'Chesterfield',a:'CHE',c:'#2463AE',div:'League Two',city:'Chesterfield',founded:1866,nick:'The Spireites',ground:'SMH Group Stadium',cap:10400,mgr:'Paul Cook',colours:'Blue & white',rivals:['Sheffield clubs','Mansfield'],honours:['Fourth Division 1969-70','Conference 2013-14'],hi:'Second Division (1946)',lo:'Conference (2010)',legends:['Ernie Moss','Alan Birchall'],bio:'The Spireites — named after the crooked spire of Chesterfield\'s church. Paul Cook\'s organisation brought them back from the Conference. League Two play-off quarter-finalists in 2026.',history:['1866: Founded','1946: Second Division — highest ever','2010: Conference','2014: Conference champions — back in Football League','2018: Relegated to National League','2022: Back in League Two','2026: League Two play-off semi-finalists']},
'grimsby-town':{n:'Grimsby Town',a:'GRI',c:'#1C1C1C',div:'League Two',city:'Grimsby',founded:1878,nick:'The Mariners',ground:'Blundell Park',cap:9052,mgr:'David Artell',colours:'Black & white stripes',rivals:['Lincoln City','Scunthorpe'],honours:['Third Division North 1955-56'],hi:'First Division (1934)',lo:'Non-League (2010)',legends:['Matt Tees','Clive Mendonca','Ivano Bonetti'],bio:'The Mariners from the fishing port. Fell to non-league in 2010 — one of the lowest moments in the club\'s history. Clive Mendonca was their great striker. Gary Hooper-era Grimsby were briefly League One regulars. David Artell\'s side scored after 26 seconds in the 2026 play-offs — then lost.',history:['1878: Founded','1934: First Division — highest finish','2010: Relegated from Football League — Conference','2016: Back in Football League','2020: League Two','2023: League Two play-offs','2026: League Two play-off semi-finalists — led after 26 secs, lost to Salford']},
'barnet':{n:'Barnet',a:'BNT',c:'#F8BC00',ck:true,div:'League Two',city:'London (Barnet)',founded:1888,nick:'The Bees',ground:'Underhill (planned move)',cap:5400,mgr:'Danny Cowley',colours:'Yellow & black',rivals:['Leyton Orient','Stevenage'],honours:['Conference 1990-91','Conference 2014-15'],hi:'Second Division (1993)',lo:'Conference (2001)',legends:['Bobby Barnes','Lee Harrison'],bio:'North London\'s non-league-to-league club. Barry Fry built them into the Football League in the 1990s. Regular Conference yo-yoers. Their stadium situation has been a saga for years — Underhill was one of football\'s quirkiest grounds.',history:['1888: Founded','1991: Conference champions — Football League entry','1993: Second Division — highest ever','2001: Relegated from Football League','2015: Back in Football League','2026: 8th in League Two']},
'swindon-town':{n:'Swindon Town',a:'SWI',c:'#CC0000',div:'League Two',city:'Swindon',founded:1879,nick:'The Robins',ground:'County Ground',cap:15728,mgr:'Michael Flynn',colours:'Red & white',rivals:['Oxford United','Bristol City'],honours:['League Two 2011-12'],hi:'Premier League (1993)',lo:'League Two (2014)',legends:['Don Rogers','Steve McMahon','Segun Odegbami'],bio:'The Robins from Wiltshire. One famous Premier League season in 1993-94. John Gorman\'s 1969 League Cup victory is the club\'s greatest moment. Manager Michael Flynn has them in League Two.',history:['1879: Founded','1969: League Cup winners — beat Arsenal 3-1, the only League Cup win by a lower-division club','1993: Premier League — won promotion via play-offs','1994: Relegated after one season','2000: Administration','2014: League Two','2020: League One champions','2022: Back in League Two','2026: 9th in League Two']},
'oldham-athletic':{n:'Oldham Athletic',a:'OLD',c:'#0044A0',div:'League Two',city:'Oldham',founded:1895,nick:'The Latics',ground:'Boundary Park',cap:10638,colours:'Blue & white',rivals:['Rochdale','Burnley','Bolton'],honours:['Second Division 1990-91'],hi:'Premier League (1992)',lo:'National League (2022)',legends:['Andy Ritchie','Earl Barrett','Ian Marshall','Nick Henry'],bio:'The original Latics. Joe Royle\'s 1990-91 side won the Second Division and was founder member of the Premier League. Famous for their Boundary Park ground, the oldest in the Football League. Fell to non-league in 2022 — returned quickly.',history:['1895: Founded','1991: Second Division champions under Joe Royle','1992: Premier League founders','1994: Relegated from PL','2004: Relegated to League One','2022: Relegated to National League — historic low','2023: Back in Football League','2026: 10th in League Two']},
'crewe-alexandra':{n:'Crewe Alexandra',a:'CRE',c:'#CC0000',div:'League Two',city:'Crewe',founded:1877,nick:'The Railwaymen',ground:'Alexandra Stadium',cap:10000,colours:'Red & white',rivals:['Shrewsbury','Wigan'],honours:['League Two 2011-12'],hi:'First Division (2003)',lo:'League Two (current)',legends:['Seth Johnson','Neil Lennon','Gradi\'s youth production line'],bio:'The Railwaymen from the junction town. Dario Gradi\'s 24-year reign as manager produced an astonishing academy — Neil Lennon, Seth Johnson, Dean Ashton all came through. First Division in 2003. Now League Two.',history:['1877: Founded','1994: First Division under Gradi','2003: First Division (second tier) — highest ever','2012: League Two champions','2020: League One','2022: Relegated to League Two','2026: 11th in League Two']},
'colchester-united':{n:'Colchester United',a:'COL',c:'#0044A0',div:'League Two',city:'Colchester',founded:1937,nick:'The U\'s',ground:'JobServe Community Stadium',cap:10000,mgr:'Ben Garner',colours:'Blue & white',rivals:['Southend','Ipswich'],honours:['Conference 1991-92'],hi:'Championship (2008)',lo:'National League (2020)',legends:['Bobby Hunt','Micky Cook','Lomana Lua Lua'],bio:'The U\'s from the oldest recorded town in Britain. Famously beat Leeds United 3-2 in the FA Cup in 1971 — one of the biggest upsets in the competition\'s history. Championship under Geraint Williams in 2008.',history:['1937: Founded','1971: Beat Leeds 3-2 in FA Cup fifth round — massive upset','1992: Conference champions','2006: League One champions','2008: Championship — highest finish','2020: National League','2022: Back in League Two','2026: 12th in League Two']},
'walsall':{n:'Walsall',a:'WAL',c:'#CC0000',div:'League Two',city:'Walsall',founded:1888,nick:'The Saddlers',ground:'Bescot Stadium',cap:11300,mgr:'Lee Grant',colours:'Red & white',rivals:['West Brom','Birmingham (area)'],honours:['Third Division 1999'],hi:'Second Division (1999)',lo:'League Two (current)',legends:['Don Penn','Allan Clarke (briefly)','Jorge Leitão'],bio:'The Saddlers from the Black Country. Named after the saddle-making industry once dominant in the area. Brief Second Division era in the late 1990s under Ray Graydon. Modest League Two club with loyal support.',history:['1888: Founded','1999: Second Division — highest ever finish','2004: Administration','2019: League One relegated','2026: 13th in League Two']},
'bristol-rovers':{n:'Bristol Rovers',a:'BRV',c:'#003087',div:'League Two',city:'Bristol',founded:1883,nick:'The Gas',ground:'Memorial Stadium',cap:12300,colours:'Blue & white quarters',rivals:['Bristol City'],honours:['Third Division South 1952-53'],hi:'Second Division (1974)',lo:'Conference (2014)',legends:['Geoff Bradford','Ronnie Briggs','Marcus Stewart','Tom Lockyer'],bio:'The Gas from the Memorial Stadium. Named "The Gas" by Bristol City fans in reference to the gasworks near their old ground. Unique culture. Tom Lockyer\'s cardiac arrest story gripped the nation. Fell to the Conference in 2014 — back in League Two via League One.',history:['1883: Founded','1974: Second Division — highest finish','2014: Conference — relegated from Football League','2015: Back in Football League — Conference play-offs','2016: League One','2017: Relegated to League Two','2022: League One again','2024: Relegated to League Two','2026: 14th in League Two']},
'fleetwood-town':{n:'Fleetwood Town',a:'FLT',c:'#CC0000',div:'League Two',city:'Fleetwood',founded:1908,nick:'The Cod Army',ground:'Highbury Stadium',cap:5311,mgr:'Craig Bellamy',colours:'Red & white',rivals:['Blackpool','Preston (area)'],honours:['Conference 2011-12','League Two 2013-14'],hi:'League One (2014)',lo:'Non-League (before 2012)',legends:['Jamie Vardy (briefly)','Nathan Pond'],bio:'The Cod Army from the Lancashire coast. Andy Pilley\'s investment took them from non-league to League One in two years. Jamie Vardy played here before Leicester. Craig Bellamy took over as manager. A small club with big ambitions.',history:['1908: Founded','2012: Conference champions — Football League entry','2014: League Two champions — League One','2019: Relegated to League Two','2024: Relegated to League Two again','2026: 15th in League Two']},
'accrington-stanley':{n:'Accrington Stanley',a:'ACC',c:'#CC0000',div:'League Two',city:'Accrington',founded:1968,nick:'Stanley',ground:'Wham Stadium',cap:5057,mgr:'John Coleman',colours:'Red & white',rivals:['Burnley','Blackburn'],honours:['Conference North 2017-18'],hi:'League One (2018)',lo:'Non-League (before 2006)',legends:['John Coleman','Brett Ormerod'],bio:'Famous from the 1989 milk advert — "Accrington Stanley, who are they? Exactly." The original club folded in 1962. Reformed in 1968. John Coleman\'s incredible long reign took them from non-league to League One. A proper English football story.',history:['Original club folded 1962','1968: Reformed','1989: Milk advert makes them briefly famous nationwide','2006: Back in Football League — Conference North champions','2018: League One — highest ever finish','2020: Relegated to League Two','2026: 16th in League Two']},
'gillingham':{n:'Gillingham',a:'GIL',c:'#003087',div:'League Two',city:'Gillingham',founded:1893,nick:'The Gills',ground:'MEMS Priestfield Stadium',cap:11582,mgr:'Mark Bonner',colours:'Blue & white',rivals:['Swindon','Bournemouth (area)'],honours:['Fourth Division 1963-64'],hi:'First Division (2000)',lo:'League Two (2022)',legends:['Brian Yeo','Carl Asaba','Robert Taylor'],bio:'The Gills from Priestfield. Carl Asaba and Robert Taylor scored two goals in the last two minutes at Wembley in 1999 to force extra time against Man City in the Division Two play-off final — one of the great late dramas. Lost on penalties.',history:['1893: Founded','1964: Fourth Division champions','1999: Play-off final drama — scored 2 in 90+ vs Man City, lost on pens','2000: First Division — highest ever','2021: Relegated from League One','2022: League Two','2026: 17th in League Two']},
'cheltenham-town':{n:'Cheltenham Town',a:'CHT',c:'#CC0000',div:'League Two',city:'Cheltenham',founded:1887,nick:'The Robins',ground:'Jonny-Rocks Stadium',cap:7066,mgr:'Wade Elliott',colours:'Red & white',rivals:['Swindon','Gloucester'],honours:['Conference 1998-99','Conference 2001-02'],hi:'League One (2003)',lo:'Conference (1992)',legends:['John Finnigan','Shane Duff'],bio:'The Robins from the Gloucestershire spa town. Two Conference titles. League One in 2003 — their highest division. Wade Elliott\'s era has been focused on stability in League Two.',history:['1887: Founded','1999: Conference champions — Football League entry','2002: Conference champions again','2003: League One','2008: Relegated from League One','2015: National League','2022: League Two','2026: 18th in League Two']},
'shrewsbury-town':{n:'Shrewsbury Town',a:'SHR',c:'#0044A0',div:'League Two',city:'Shrewsbury',founded:1886,nick:'The Shrews',ground:'Montgomery Waters Meadow',cap:9875,mgr:'Paul Hurst',colours:'Blue & amber',rivals:['Wrexham','Walsall','Wolverhampton'],honours:['Third Division 1978-79'],hi:'Second Division (1979)',lo:'Conference (2003)',legends:['Arthur Rowley (all-time record League goalscorer)','Mike Mulhall'],bio:'Arthur Rowley, the all-time Football League goalscorer (434 goals), ended his career as player-manager here. The Shrews reached the Second Division in 1979. Conference exiles in the 2000s. Paul Hurst\'s stability in League Two.',history:['1886: Founded','1979: Third Division champions — Second Division (highest ever)','1989: Welsh Cup final era','2003: Conference','2004: Back in Football League','2012: League One','2026: 19th in League Two']},
'newport-county':{n:'Newport County',a:'NPT',c:'#F8BC00',ck:true,div:'League Two',city:'Newport',founded:1912,nick:'The Exiles',ground:'Rodney Parade',cap:7850,mgr:'Nelson Jardim',colours:'Yellow & black',rivals:['Cardiff City (area)','Merthyr'],honours:['Conference 2012-13'],hi:'Second Division (1947)',lo:'Non-League (1988)',legends:['Len Davies','Malcolm Allen'],bio:'The Exiles. Newport County went out of the Football League in 1988 and were reformed in 1989, spending 24 years in non-league before returning in 2013. Famous for their 2019 FA Cup run that eliminated Leicester City.',history:['1912: Founded','1947: Second Division — highest ever','1988: Wound up, out of Football League','1989: Reformed','2013: Conference play-off winners — back in Football League','2017: League Two proper','2019: Beat Leicester City in FA Cup fourth round','2026: 20th in League Two']},
'tranmere-rovers':{n:'Tranmere Rovers',a:'TRN',c:'#0044A0',div:'League Two',city:'Birkenhead (Merseyside)',founded:1884,nick:'Rovers',ground:'Prenton Park',cap:16567,colours:'Blue & white',rivals:['Everton (area)','Liverpool (area)'],honours:['League Cup Final 2000'],hi:'First Division (1993)',lo:'National League (2015)',legends:['John Aldridge','Pat Nevin','Ian Muir'],bio:'Merseyside\'s third club. John Aldridge finished his career here after Liverpool. Famous for their 1990s lower-league cup runs under John King. League Cup finalists in 2000 — lost to Leicester. Fell to National League in 2015.',history:['1884: Founded','1993: First Division (second tier) — highest','2000: League Cup final — lost to Leicester City','2001: Relegated from First Division','2015: National League — fell from Football League','2018: Back in Football League','2026: 21st in League Two']},
'crawley-town':{n:'Crawley Town',a:'CRW',c:'#CC0000',div:'National League',city:'Crawley',founded:1896,nick:'The Red Devils',ground:'Broadfield Stadium',cap:6134,mgr:'Scott Lindsey',colours:'Red & white',rivals:['Brighton (area)'],honours:['Conference South 2010-11'],hi:'League One (2012)',lo:'National League (2026)',legends:['Steve Kabba','Nicky Adams'],bio:'Crawley made headlines when ambitious owners brought in ex-Premier League players for non-league football in the 2010s. Reached League One. Relegated to the National League in 2026.',history:['1896: Founded','2011: Conference South champions — Football League entry','2012: League Two play-off winners — League One','2015: Relegated to League Two','2026: Relegated to National League']},
'harrogate-town':{n:'Harrogate Town',a:'HGT',c:'#F8BC00',ck:true,div:'National League',city:'Harrogate',founded:1914,nick:'Town',ground:'Envirovent Stadium',cap:3500,colours:'Yellow & black',rivals:['York City','Bradford (area)'],honours:['National League North 2019-20'],hi:'League Two (2020)',lo:'National League (before 2020)',legends:['Aaron Martin','Jack Muldoon'],bio:'The smallest club ever to reach the Football League by population. Simon Weaver\'s side won the National League North in 2020 — the first EFL club from Harrogate in the town\'s history. Six seasons in League Two ended with relegation in 2026.',history:['1914: Founded','2020: National League play-off final at Wembley — promoted to League Two','2026: Relegated to National League after 6-season EFL stay']},
'barrow':{n:'Barrow',a:'BRW',c:'#CC0000',div:'National League',city:'Barrow-in-Furness',founded:1901,nick:'The Bluebirds',ground:'Holker Street',cap:5006,colours:'Blue & white',rivals:['Carlisle','Morecambe'],honours:['Conference 2019-20'],hi:'League Two (2020)',lo:'National League (before 2020)',legends:['Ken Mallalieu','Paul Wilson'],bio:'From the old shipbuilding town on the Cumbrian coast. Back in the Football League in 2020 after 48 years away. Newport County sent them down on the final day of 2026.',history:['1901: Founded','1972: Relegated from Football League','2020: Conference champions — back in Football League after 48 years','2026: Relegated to National League — Newport sent them down']},
/* === NATIONAL LEAGUE === */
'rochdale':{n:'Rochdale',a:'ROC',c:'#003087',div:'National League',city:'Rochdale',founded:1907,nick:'The Dale',ground:'Crown Oil Arena',cap:10249,colours:'Blue & white',rivals:['Oldham Athletic','Bury'],honours:['National League Play-Off Final 2026'],hi:'League One (2010)',lo:'National League',legends:['Albert Whitehurst','Grant Holt (briefly)','Scott Hogan'],bio:'The Dale. Rochdale won the 2026 National League play-off final against Boreham Wood in extraordinary circumstances — 2-0 down with minutes left, they equalised in the last seconds and won on penalties. Back in the EFL.',history:['1907: Founded','1962: League Cup final — lost to Norwich','2010: League One — highest ever','2014: Relegated from League One','2020: League Two','2022: Relegated to National League','2026: National League play-off final winners — beat Boreham Wood on pens after comeback']},
'boreham-wood':{n:'Boreham Wood',a:'BWD',c:'#CC0000',div:'National League',city:'Borehamwood',founded:1948,nick:'The Wood',ground:'Meadow Park',cap:4502,colours:'Red & white',rivals:['Barnet','Enfield'],honours:['National League South 2015-16'],hi:'National League (current)',lo:'Non-League (lower divisions)',legends:['Bruno N\'Gotty (owner)','Andy Cook'],bio:'Ambitious National League club backed by entertainment industry connections. Led the 2026 final 2-0 with minutes to go — heartbreaking defeat to Rochdale. Based in the celebrity suburb of London.',history:['1948: Founded','2016: National League South champions','2017: National League proper','2026: National League play-off final — led 2-0, lost to Rochdale in extra time']},
'york-city':{n:'York City',a:'YOR',c:'#CC0000',div:'National League',city:'York',founded:1922,nick:'The Minstermen',ground:'LNER Community Stadium',cap:8000,colours:'Red & white',rivals:['Harrogate','Scarborough'],honours:['National League 2021-22'],hi:'Second Division (1975)',lo:'National League',legends:['Barry Swallow','Keith Walwyn','Arthur Bottom'],bio:'The Minstermen from the city of York. Keith Walwyn — one of the great lower-league strikers — is a club legend. Second Division in 1975. Back in the Football League in 2022 but relegated back to National League.',history:['1922: Founded','1955: FA Cup semi-finalists — beat Tottenham en route','1975: Second Division — highest ever','2002: Relegated from Football League','2022: National League champions — back in League Two','2024: Relegated to National League again']},
'fc-halifax-town':{n:'FC Halifax Town',a:'HAL',c:'#003087',div:'National League',city:'Halifax',founded:2008,nick:'The Shaymen',ground:'The Shay',cap:14000,colours:'Blue & white',rivals:['Bradford City (area)'],honours:['None as re-formed club'],hi:'National League (current)',lo:'Foundation (2008)',legends:['Andy Kirk','Tom Clarke'],bio:'Halifax Town entered administration in 2008 and reformed as FC Halifax Town. The Shay is a large ground for non-league football. Established National League club now.',history:['Original Halifax Town: 1911-2008','2008: Reformed as FC Halifax Town in Conference North','2012: Conference North champions','2016: National League','2024: Promoted from National League North to National League']},
'solihull-moors':{n:'Solihull Moors',a:'SOL',c:'#C8102E',div:'National League',city:'Solihull',founded:2007,nick:'The Moors',ground:'SportNation.bet Stadium',cap:3050,colours:'Red & white',rivals:['Kidderminster','Birmingham (area)'],honours:['National League North 2021-22'],hi:'National League (current)',lo:'Non-League lower divisions',legends:['Kyle Hudlin'],bio:'Formed from the merger of Moor Green and Solihull Borough in 2007. Kyle Hudlin — a 6\'7" striker — became a social media sensation. National League North champions in 2022 and established in the top tier of non-league since.',history:['2007: Formed from merger','2022: National League North champions — promoted to National League','2026: National League']},
'eastleigh':{n:'Eastleigh',a:'EAL',c:'#C8102E',div:'National League',city:'Eastleigh',founded:1946,nick:'The Spitfires',ground:'Silverlake Stadium',cap:5250,colours:'Red & white',rivals:['Aldershot','Southampton (area)'],honours:['National League South 2013-14'],hi:'National League (current)',lo:'Non-League lower divisions',legends:['Jai Reason'],bio:'The Spitfires — named after the famous WWII aircraft built at the nearby Supermarine factory. Long-established National League outfit backed by Peterborough owner Darragh MacAnthony for a period.',history:['1946: Founded','2014: National League South champions','2015: National League proper','2026: National League']},
'aldershot-town':{n:'Aldershot Town',a:'ALD',c:'#CC0000',div:'National League',city:'Aldershot',founded:1992,nick:'The Shots',ground:'EBB Stadium',cap:7100,colours:'Red & blue',rivals:['Woking','Farnborough'],honours:['Isthmian League Premier 2001-02'],hi:'League Two (2011)',lo:'Non-League',legends:['Marvin Morgan','Brett Williams'],bio:'Reformed in 1992 after the original Aldershot FC was wound up. The recreation ground is their historic home. Rapidly rose through the Conference to League Two in 2008. Relegated in 2013 but back in the National League.',history:['Original Aldershot FC wound up 1992','1992: Aldershot Town founded','2008: Conference champions — Football League','2013: Relegated from League Two to Conference','2026: National League']},
'gateshead':{n:'Gateshead',a:'GAT',c:'#1C1C1C',div:'National League',city:'Gateshead',founded:1930,nick:'The Heed',ground:'Gateshead International Stadium',cap:11795,colours:'Black & white',rivals:['Sunderland (area)','Newcastle (area)'],honours:['Northern Premier League (multiple)'],hi:'National League (current)',lo:'Non-League lower tiers',legends:['Anthony Sweeney'],bio:'Gateshead from across the Tyne from Newcastle. Iconic International Stadium. Long history in the Northern Premier League. Now established in the National League.',history:['1930: Founded','1960: Resigned from Football League','2014: National League','2016: Relegated from National League','2023: Back in National League']},
'woking':{n:'Woking',a:'WOK',c:'#CC0000',div:'National League',city:'Woking',founded:1889,nick:'The Cards',ground:'Kingfield Stadium',cap:6000,colours:'Red & white',rivals:['Aldershot','Sutton United'],honours:['Conference 1994-95','FA Trophy (multiple)'],hi:'Conference (1995)',lo:'National League South',legends:['Clive Walker','Tim Buzaglo'],bio:'Woking\'s greatest moment was Tim Buzaglo\'s hat-trick that knocked West Brom out of the FA Cup in 1991. Conference champions in 1994-95 but their ground couldn\'t meet Football League standards.',history:['1889: Founded','1991: Buzaglo hat-trick beats West Brom in FA Cup — one of the great giant-killings','1995: Conference champions — couldn\'t meet FL ground grading','2022: Back in National League','2026: National League']},
'afc-fylde-nl':{n:'AFC Fylde',a:'FYL',c:'#CC0000',div:'National League',city:'Kirkham',founded:1988,nick:'The Coasters',ground:'Mill Farm',cap:6000,colours:'White & red',rivals:['Fleetwood','Blackpool (area)'],honours:['National League North 2025-26'],hi:'National League (2026)',lo:'Non-League lower tiers',legends:['Danny Rowe','Jordan Williams'],bio:'AFC Fylde won the National League North title in 2026 with 100 points — promoted to the National League. Mill Farm is one of the best grounds in non-league football, with a leisure complex attached.',history:['1988: Founded','2018: National League — relegated same year','2026: NL North champions with 100pts — National League']},
'wealdstone':{n:'Wealdstone',a:'WLD',c:'#CC0000',div:'National League',city:'Harrow',founded:1899,nick:'The Stones',ground:'Grosvenor Vale',cap:3000,colours:'Red & white',rivals:['Harrow Borough'],honours:['National League South 2019-20'],hi:'National League (current)',lo:'Non-League lower divisions',legends:['Stuart Pearce (youth)'],bio:'The Stones from Harrow. Stuart Pearce played youth football here. National League South champions in 2020 and steady National League performers since.',history:['1899: Founded','2020: National League South champions','2021: National League','2026: National League']},
'kidderminster-harriers':{n:'Kidderminster Harriers',a:'KID',c:'#CC0000',div:'National League',city:'Kidderminster',founded:1886,nick:'The Harriers',ground:'Aggborough Stadium',cap:6444,colours:'Red & white',rivals:['Worcester City','Hereford'],honours:['Conference 1993-94','Conference 1999-00'],hi:'League Two (2004)',lo:'Conference North',legends:['Barry Horne','Dean Sturridge'],bio:'Harriers from the carpet-making town. Two Conference championships. Steve Bull\'s father played for them. Reached League Two in 2000. Won the NL North play-offs in 2026 to return to the National League.',history:['1886: Founded','1994: Conference champions','2000: Conference champions — League Two entry','2004: Relegated from Football League','2014: Relegated to Conference North','2026: NL North play-off winners — back in National League']},
'dagenham-redbridge':{n:'Dagenham & Redbridge',a:'DAG',c:'#CC0000',div:'National League',city:'Dagenham',founded:1992,nick:'The Daggers',ground:'Victoria Road',cap:6000,colours:'Red & white',rivals:['Barnet','Leyton Orient'],honours:['Conference 2006-07'],hi:'League Two (2007)',lo:'National League South',legends:['Jon Nurse','Ben Strevens'],bio:'Formed from merger of Dagenham FC and Redbridge Forest in 1992. Conference champions in 2007. Ford motor plant workers\' club. Relegated from League Two and spent time in National League South before returning.',history:['1992: Founded from merger','2007: Conference champions — Football League entry','2016: Relegated from League Two','2019: National League South','2023: Back in National League','2026: National League']},
'maidstone-united':{n:'Maidstone United',a:'MAI',c:'#FFD700',ck:true,div:'National League',city:'Maidstone',founded:2010,nick:'The Stones',ground:'Gallagher Stadium',cap:4200,colours:'Gold & black',rivals:['Ebbsfleet','Gillingham'],honours:['National League South 2016-17','National League South 2023-24'],hi:'National League (current)',lo:'Non-League lower tiers (reformed 2010)',legends:['Jack Barham'],bio:'The original Maidstone United won the Conference in 1989 but were disbanded in 1992 due to finances. Reformed in 2010 and have risen rapidly — National League South champions twice and now established in the National League.',history:['Original club founded 1897, disbanded 1992','2010: Reformed','2017: National League South champions — National League entry','2021: Relegated to National League South','2024: National League South champions again','2026: National League']},
'sutton-united':{n:'Sutton United',a:'SUT',c:'#FFB81C',ck:true,div:'National League',city:'Sutton (Surrey)',founded:1898,nick:'The U\'s',ground:'Gander Green Lane',cap:5013,colours:'Amber & chocolate',rivals:['Woking','Kingstonian'],honours:['National League 2020-21'],hi:'League Two (2021)',lo:'National League South',legends:['Junior Agogo (youth)','Kenny Beavis'],bio:'Sutton United are part of football folklore from their 1989 FA Cup upset — Coventry City keeper Dave Beasant played in goal wearing a replica kit. National League champions in 2021. Gander Green Lane is one of non-league\'s most beloved grounds.',history:['1898: Founded','1989: FA Cup — beat Coventry City 2-1, keeper Beasant wore a replica Coventry kit in the pie-eating controversy','2021: National League champions — League Two entry','2023: Relegated from League Two','2026: National League']},
'torquay-united':{n:'Torquay United',a:'TOR',c:'#FFD700',ck:true,div:'National League South',city:'Torquay',founded:1899,nick:'The Gulls',ground:'Plainmoor',cap:6500,colours:'Yellow & white',rivals:['Plymouth Argyle','Exeter City'],honours:['National League South 2020-21'],hi:'Second Division (1968)',lo:'National League South',legends:['Lee Sharpe (briefly)','Robin Stubbs'],bio:'The Gulls from the English Riviera. One of the most picturesque football grounds in England. Regularly fell in and out of the Football League. Lost the 2026 NL South play-off final to Hornchurch in the 117th minute.',history:['1899: Founded','1968: Second Division — highest ever','2007: Relegated from Football League','2009: Back in Football League','2012: Play-off final — lost to Cheltenham','2019: Relegated from Football League again','2021: National League South champions','2026: National League South play-off final — lost to Hornchurch in 117th minute']},
'altrincham':{n:'Altrincham',a:'ALT',c:'#CC0000',div:'National League',city:'Altrincham',founded:1891,nick:'The Robins',ground:'J.Davidson Stadium',cap:6085,colours:'Red & white',rivals:['Hyde','Stockport'],honours:['National League 2020-21'],hi:'Alliance Premier League (1980 — founders)',lo:'Non-League lower divisions',legends:['John King','Gwyn Davies'],bio:'Alliance Premier League founding members in 1979. One of non-league\'s most storied clubs. Famous for their 1980s FA Cup giant-killings. Returned to the National League in 2020 after years lower down.',history:['1891: Founded','1979: Founding members of Alliance Premier League','1980: Beat Everton and Tottenham in FA Cup on famous runs','2020: Conference North champions — back in National League','2026: National League']},
'southend-united':{n:'Southend United',a:'SHU',c:'#003087',div:'National League',city:'Southend-on-Sea',founded:1906,nick:'The Shrimpers',ground:'Roots Hall',cap:12392,colours:'Blue & white',rivals:['Colchester United','Chelmsford'],honours:['League Two 2005-06'],hi:'First Division (1991)',lo:'National League',legends:['Dickie Dowsett','Roy Hollis','Stan Collymore (briefly)'],bio:'Southend have been a Football League club for most of their existence. First Division in 1991. Financial chaos under various owners caused their fall to the National League.',history:['1906: Founded','1991: First Division — highest ever','2006: League Two champions','2022: Administration, relegated to National League','2026: National League']},
'scunthorpe-united':{n:'Scunthorpe United',a:'SCU',c:'#C8102E',div:'National League',city:'Scunthorpe',founded:1899,nick:'The Iron',ground:'Sands Venue Stadium',cap:9183,colours:'Claret & blue',rivals:['Grimsby','Lincoln'],honours:['Third Division North 1957-58'],hi:'League One (2007)',lo:'National League',legends:['Neil Redfearn','Ian Botham (brief)','Kevin Keegan (youth)'],bio:'Scunthorpe are famous as the town whose name was famously blocked by early internet filters. Kevin Keegan began his career here before Liverpool. Ian Botham briefly played. Fell to the National League in 2023.',history:['1899: Founded','1958: Third Division North champions','2007: League One — highest finish in decades','2013: League Two relegated','2018: Championship briefly','2023: Relegated to National League','2026: National League']},
'maidenhead-united':{n:'Maidenhead United',a:'MHD',c:'#CC0000',div:'National League',city:'Maidenhead',founded:1870,nick:'The Magpies',ground:'York Road',cap:4000,colours:'Red & black',rivals:['Slough','Wycombe'],honours:['National League South 2016-17'],hi:'National League (current)',lo:'Non-League lower divisions',legends:['Mark Nisbet'],bio:'Maidenhead United play at York Road — one of the oldest continually-used football grounds in the world, in use since 1871. National League South champions in 2017 and established National League club since.',history:['1870: Founded','1871: York Road first used — one of world\'s oldest football grounds','2017: National League South champions','2026: National League']},
/* === NATIONAL LEAGUE NORTH === */
'afc-fylde':{n:'AFC Fylde',a:'FYL',c:'#CC0000',div:'National League North',city:'Kirkham',founded:1988,nick:'The Coasters',ground:'Mill Farm',cap:6000,colours:'White & red',rivals:['Fleetwood (area)'],bio:'Champions of the National League North 2025-26 with 100 points, promoted to the National League.',history:['1988: Founded','2026: National League North champions — promoted']},
'south-shields':{n:'South Shields',a:'SSH',c:'#CC0000',div:'National League North',city:'South Shields',founded:1888,nick:'The Mariners',ground:'1st Cloud Arena',cap:5000,colours:'Red & white',rivals:['Gateshead','Sunderland (area)'],bio:'South Shields reformed in 1936 and built back to National League North. New modern stadium opened 2020. Runners-up in 2026.',history:['1888: Founded','1936: Reformed','2017: Northern Premier League champions','2023: National League North','2026: NL North runners-up']},
'brackley-town':{n:'Brackley Town',a:'BKL',c:'#CC0000',div:'National League North',city:'Brackley',founded:1890,nick:'Saints',ground:'St James Park',cap:3500,colours:'Red & white',rivals:['Banbury United'],bio:'Brackley Town rose rapidly through the non-league pyramid. FA Trophy runners-up 2018. National League North regulars.',history:['1890: Founded','2015: National League North','2026: National League North']},
'bamber-bridge':{n:'Boston United',a:'BOS',c:'#F8BC00',ck:true,div:'National League North',city:'Boston',founded:1934,nick:'The Pilgrims',ground:'Jakemans Community Stadium',cap:6643,colours:'Yellow & black',rivals:['Lincoln City','Grimsby'],bio:'Boston United were famously in the Football League in the early 2000s before financial catastrophe. Back in the National League North after years rebuilding.',history:['1934: Founded','2002: Football League after Conference title','2007: Administration, fell to lower non-league','2020: National League North','2026: National League North']},
'hereford':{n:'Hereford FC',a:'HER',c:'#CC0000',div:'National League North',city:'Hereford',founded:2014,nick:'The Bulls',ground:'Edgar Street',cap:5700,colours:'White & black',rivals:['Worcester City','Kidderminster'],bio:'The original Hereford United was wound up in 2014. Fans reformed the club that same year. Famous for the Ronnie Radford FA Cup goal vs Newcastle (1972). Rebuilt through the pyramid.',history:['Original United: 1939-2014','2014: Reformed as Hereford FC','1972: ORIGINAL — Ronnie Radford\'s FA Cup thunderbolt vs Newcastle','2026: National League North']},
'curzon-ashton':{n:'Curzon Ashton',a:'CUR',c:'#003087',div:'National League North',city:'Ashton-under-Lyne',founded:1963,nick:'The Nash',ground:'Tameside Stadium',cap:4000,colours:'Blue & white',rivals:['Hyde','Stalybridge'],bio:'Relegated from NL North in 2026 on goal difference — both Curzon and Alfreton drew 3-3 on the final day and both went down. The most brutal way to end a season.',history:['1963: Founded','2023: National League North','2026: Relegated on goal difference — drew 3-3 with Alfreton on final day']},
'alfreton-town':{n:'Alfreton Town',a:'ALF',c:'#CC0000',div:'National League North',city:'Alfreton',founded:1959,nick:'The Reds',ground:'Impact Arena',cap:3500,colours:'Red & white',rivals:['Matlock','Burton (area)'],bio:'Relegated alongside Curzon Ashton in 2026 — the two sides drew 3-3 on the final day and both went down on goal difference.',history:['1959: Founded','2018: National League North','2026: Relegated — drew 3-3 with Curzon Ashton, both went down on GD']},
'spennymoor-town':{n:'Spennymoor Town',a:'SPN',c:'#003087',div:'National League North',city:'Spennymoor',founded:1904,nick:'The Moors',ground:'Brewery Field',cap:3500,colours:'Blue & white',rivals:['Bishop Auckland (area)'],bio:'Spennymoor Town have been one of the fastest-rising non-league clubs in the North East, winning multiple Northern Premier League titles under Jason Ainsley.',history:['1904: Founded','2018: National League North','2026: National League North']},
'blyth-spartans':{n:'Blyth Spartans',a:'BLY',c:'#1C1C1C',div:'National League North',city:'Blyth',founded:1899,nick:'Spartans',ground:'Croft Park',cap:4435,colours:'Green & white',rivals:['South Shields','Gateshead'],bio:'Famous for their 1978 FA Cup run when they reached the fifth round as a non-league side. An iconic name in English non-league football.',history:['1899: Founded','1978: FA Cup fifth round as non-league club — iconic','2019: National League North','2026: National League North']},
'chester':{n:'Chester FC',a:'CHR',c:'#003087',div:'National League North',city:'Chester',founded:2010,nick:'The Blues',ground:'Deva Stadium',cap:5000,colours:'Blue & white',rivals:['Wrexham','Crewe'],bio:'The original Chester City was wound up in 2010. Fans reformed as Chester FC. The Deva Stadium straddles the English-Welsh border. Rebuilding back up the pyramid.',history:['Original Chester City: 1885-2010','2010: Reformed as Chester FC','2018: National League','2019: Relegated to National League North','2026: National League North']},
'gloucester-city':{n:'Gloucester City',a:'GCT',c:'#CC0000',div:'National League North',city:'Gloucester',founded:1889,nick:'The Tigers',ground:'Meadow Park',cap:4000,colours:'Red & white',rivals:['Forest Green Rovers','Cheltenham'],bio:'Gloucester City. Their own ground was flooded in 2007 and they were homeless for years. Have since settled and work their way up through non-league.',history:['1889: Founded','2007: Stadium flooded — groundshare for years','2023: National League North','2026: National League North']},
'scarborough-athletic':{n:'Scarborough Athletic',a:'SCA',c:'#CC0000',div:'National League North',city:'Scarborough',founded:2007,nick:'The Seadogs',ground:'Flamingo Land Stadium',cap:3200,colours:'Red & white',rivals:['York City'],bio:'The original Scarborough FC was wound up in 2007. Reformed as Scarborough Athletic, they have risen back to the National League North. New stadium opened 2023.',history:['Original Scarborough FC: 1879-2007','2007: Reformed as Scarborough Athletic','2023: National League North','2026: National League North']},
'fc-united-of-manchester':{n:'FC United of Manchester',a:'FCU',c:'#CC0000',div:'National League North',city:'Manchester',founded:2005,nick:'FC United',ground:'Broadhurst Park',cap:5000,colours:'Red & white',rivals:['Manchester United (from which they emerged)'],bio:'Formed in 2005 by Manchester United supporters protesting the Glazer takeover. Community-owned. Broadhurst Park was built by the fans. A symbol of fan-owned football.',history:['2005: Founded by Manchester United fans protesting Glazer takeover','2015: Opened Broadhurst Park','2015: National League North','2020: Relegated','2024: Back in National League North','2026: National League North']},
'stafford-rangers':{n:'Guiseley',a:'GUI',c:'#003087',div:'National League North',city:'Guiseley',founded:1909,nick:'The Lions',ground:'Nethermoor Park',cap:3000,colours:'Blue & white',rivals:['Bradford City (area)'],bio:'Yorkshire non-league club, home to an impressive community stadium. National League North regulars.',history:['1909: Founded','2016: National League — relegated 2017','2019: National League North','2026: National League North']},
/* === NATIONAL LEAGUE SOUTH === */
'worthing':{n:'Worthing',a:'WOR',c:'#CC0000',div:'National League South',city:'Worthing',founded:1886,nick:'The Rebels',ground:'Woodside Road',cap:3500,colours:'Red & white',rivals:['Bognor Regis','Eastbourne'],bio:'Worthing won the National League South title in 2026 with a 2-0 win against Ebbsfleet on the final day. Promoted to the National League.',history:['1886: Founded','2024: National League South','2026: NL South champions — promoted to National League']},
'hornchurch':{n:'Hornchurch',a:'HRN',c:'#CC0000',div:'National League South',city:'Hornchurch',founded:1923,nick:'The Urchins',ground:'Hornchurch Stadium',cap:3500,colours:'Red & white',rivals:['Thurrock','Tilbury'],bio:'Hornchurch won the 2026 NL South play-off final in extraordinary fashion — a goal in the 117th minute of extra time against Torquay. Promoted to the National League.',history:['1923: Founded','2023: National League South','2026: NL South play-off winners — 117th-minute goal vs Torquay, promoted']},
'ebbsfleet-united':{n:'Ebbsfleet United',a:'EBB',c:'#CC0000',div:'National League South',city:'Northfleet',founded:1946,nick:'The Fleet',ground:'Stonebridge Road',cap:4700,colours:'Red & white',rivals:['Maidstone United','Dartford'],bio:'Ebbsfleet United, famous for the 2008 MyFootballClub buyout by 27,000 fans online. Have bounced between NL and NL South.',history:['1946: Founded','2008: Conference South champions — MyFootballClub era','2019: Relegated to NL South','2026: NL South — finished runners-up, missed promotion']},
'bath-city':{n:'Bath City',a:'BAT',c:'#1C1C1C',div:'National League South',city:'Bath',founded:1889,nick:'The Romans',ground:'Twerton Park',cap:8840,colours:'Black & white',rivals:['Chippenham Town','Forest Green'],bio:'Bath City play in a UNESCO World Heritage city. Twerton Park has hosted numerous non-league classics. Relegated from NL South in 2026.',history:['1889: Founded','2016: National League South','2026: Relegated from NL South']},
'chippenham-town':{n:'Chippenham Town',a:'CPM',c:'#003087',div:'National League South',city:'Chippenham',founded:1873,nick:'The Bluebirds',ground:'Hardenhuish Park',cap:4000,colours:'Blue & white',rivals:['Bath City','Swindon (area)'],bio:'One of the oldest clubs in the south west. Chippenham have had consistent non-league football for decades. Relegated from NL South in 2026.',history:['1873: Founded','2018: National League South','2026: Relegated from NL South']},
'hampton-richmond-borough':{n:'Hampton & Richmond Borough',a:'HRB',c:'#CC0000',div:'National League South',city:'Hampton',founded:1921,nick:'The Beavers',ground:'Beveree Stadium',cap:3000,colours:'Red & white',rivals:['Sutton United','Maidstone'],bio:'The Beavers from south-west London. Consistent National League South performers.',history:['1921: Founded','2016: National League South','2026: National League South']},
'braintree-town':{n:'Braintree Town',a:'BRT',c:'#FFD700',ck:true,div:'National League South',city:'Braintree',founded:1898,nick:'The Iron',ground:'Cressing Road',cap:4000,colours:'Yellow & blue',rivals:['Chelmsford','Colchester (area)'],bio:'Braintree Town had their golden era in the early 2010s — Conference champions in 2011. Now back in NL South.',history:['1898: Founded','2011: Conference South champions — National League entry','2012: Conference','2018: Relegated to NL South','2026: National League South']},
'dartford':{n:'Dartford',a:'DAR',c:'#CC0000',div:'National League South',city:'Dartford',founded:1888,nick:'The Darts',ground:'Princes Park',cap:4100,colours:'Red & white',rivals:['Ebbsfleet','Maidstone'],bio:'Kent non-league stalwarts. Princes Park is a modern stadium. Long-established NL South club.',history:['1888: Founded','2012: NL South (then Southern League)','2026: National League South']},
'havant-waterlooville':{n:'Havant & Waterlooville',a:'HAV',c:'#CC0000',div:'National League South',city:'Havant',founded:1998,nick:'The Hawks',ground:'Westleigh Park',cap:5750,colours:'Red & white',rivals:['Eastleigh','Aldershot'],bio:'Formed from merger of Havant Town and Waterlooville in 1998. Famous for their 2008 FA Cup run — beat Swansea and Notts County before losing to Liverpool at Anfield.',history:['1998: Founded from merger','2008: FA Cup third round at Anfield — led Liverpool 1-0 before losing 5-2','2016: National League South','2026: National League South']},
'hemel-hempstead-town':{n:'Hemel Hempstead Town',a:'HHT',c:'#003087',div:'National League South',city:'Hemel Hempstead',founded:1885,nick:'Tudors',ground:'Vauxhall Road',cap:3500,colours:'Blue & white',rivals:['St Albans','Chesham'],bio:'Hemel Hempstead — the Tudors. Have risen steadily through the non-league pyramid to NL South.',history:['1885: Founded','2022: National League South','2026: National League South']},
'kings-lynn-town':{n:'King\'s Lynn Town',a:'KLT',c:'#FFD700',ck:true,div:'National League South',city:'King\'s Lynn',founded:2010,nick:'The Linnets',ground:'The Walks Stadium',cap:8200,colours:'Yellow & blue',rivals:['Kettering (area)'],bio:'King\'s Lynn Town are the reformed version of King\'s Lynn FC (folded 2010). The Walks Stadium is a large ground for non-league football. National League South regular.',history:['2010: Reformed','2021: National League North','2022: Relegated to NL South (joined South division based on geography)','2026: National League South']},
'sittingbourne':{n:'Tonbridge Angels',a:'TNA',c:'#CC0000',div:'National League South',city:'Tonbridge',founded:1948,nick:'Angels',ground:'Longmead Stadium',cap:3500,colours:'Blue & white',rivals:['Maidstone','Dartford'],bio:'Tonbridge Angels — Kentish non-league club, consistent performers at NL South level.',history:['1948: Founded','2022: National League South','2026: National League South']},
'welling-united':{n:'Welling United',a:'WEL',c:'#CC0000',div:'National League South',city:'Welling',founded:1963,nick:'The Wings',ground:'Park View Road',cap:4000,colours:'Red & white',rivals:['Bromley','Dartford'],bio:'Welling United from south-east London. Park View Road has a distinctive slope. Former Conference members.',history:['1963: Founded','1986: Conference (then Alliance)','2013: Conference South','2026: National League South']},
'chesham-united':{n:'Chesham United',a:'CHU',c:'#CC0000',div:'National League South',city:'Chesham',founded:1917,nick:'The Generals',ground:'The Meadow',cap:5000,colours:'Claret & blue',rivals:['Hemel Hempstead','Berkhamsted'],bio:'One of the more traditional Southern non-league clubs. Chesham United have been in NL South in recent seasons.',history:['1917: Founded','2022: National League South','2026: National League South']},
'enfield-town':{n:'Enfield Town',a:'ENF',c:'#CC0000',div:'National League South',city:'Enfield',founded:2001,nick:'Town',ground:'Queen Elizabeth II Stadium',cap:2500,colours:'Red & white',rivals:['Barnet','Wealdstone'],bio:'Enfield Town were formed in 2001 after Enfield FC merged with Brimsdown Rovers amid controversy. The reformed club represents the community. Relegated from NL South in 2026.',history:['2001: Founded','2022: National League South','2026: Relegated from NL South']},
'eastbourne-borough':{n:'Eastbourne Borough',a:'EBR',c:'#CC0000',div:'National League South',city:'Eastbourne',founded:1964,nick:'The Sports',ground:'Priory Lane',cap:4151,colours:'Red & black',rivals:['Bognor Regis','Lewes'],bio:'Eastbourne Borough — the Sports. Former Conference members. Relegated from NL South in 2026.',history:['1964: Founded','2008: Conference','2013: Relegated from Conference','2024: Back in NL South','2026: Relegated from NL South']},
'oxford-city':{n:'Oxford City',a:'OXC',c:'#003087',div:'National League South',city:'Oxford',founded:1882,nick:'The Hoops',ground:'Court Place Farm',cap:3000,colours:'Blue & white',rivals:['Oxford United (local rivalry)'],bio:'Oxford City — not to be confused with Oxford United. One of England\'s oldest amateur clubs. Consistently at NL South level.',history:['1882: Founded','2015: National League South','2026: National League South']},
'bishops-stortford':{n:'Bishop\'s Stortford',a:'BST',c:'#003087',div:'National League South',city:'Bishop\'s Stortford',founded:1874,nick:'The Blues',ground:'ProKit UK Stadium',cap:4700,colours:'Blue & white',rivals:['Chelmsford','Boreham Wood'],bio:'Bishop\'s Stortford play in the Hertfordshire market town. Long history in the Southern League and Isthmian League.',history:['1874: Founded','2023: National League South','2026: National League South']},
};

const TRANSFERS = [
  // ── CHAMPIONSHIP — CONFIRMED SIGNINGS ────────────────────────────────────
  {club:'Wolverhampton Wanderers',player:'Raúl Jiménez',age:35,from:'Free agent',fee:'Free',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Wolverhampton Wanderers',player:'Kieran Trippier',age:35,from:'Free agent',fee:'Free',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Bolton Wanderers',player:'David Watson',age:21,from:'Kilmarnock',fee:'Compensation',type:'in',date:'27 May 2026',status:'confirmed'},
  {club:'Lincoln City',player:'Callum Elder',age:31,from:'Derby County (released)',fee:'Free',type:'in',date:'29 Jun 2026',status:'confirmed'},
  {club:'Birmingham City',player:'Jhon Solis',age:22,from:'Girona',fee:'Undisclosed',type:'in',date:'15 Jun 2026',status:'confirmed'},
  {club:'Bristol City',player:'Gibson Yah',age:22,from:'Willem II',fee:'Undisclosed',type:'in',date:'26 Jun 2026',status:'confirmed'},
  {club:'Charlton Athletic',player:'Ivan Mesik',age:23,from:'Slovan Bratislava',fee:'Undisclosed',type:'in',date:'30 Jun 2026',status:'confirmed'},
  {club:'Millwall',player:'Jenson Metcalfe',age:20,from:'Bradford City',fee:'Undisclosed',type:'in',date:'17 Jun 2026',status:'confirmed'},
  {club:'Norwich City',player:'Bruno Alves',age:19,from:'Cruzeiro (loan)',fee:'Loan',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Norwich City',player:'Andre Brooks',age:20,from:'Sheffield United',fee:'Undisclosed',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'QPR',player:'Boy Kemper',age:24,from:'Excelsior',fee:'Undisclosed',type:'in',date:'20 Jun 2026',status:'confirmed'},
  {club:'Stoke City',player:'Djibril Soumare',age:22,from:'Sheffield United (loan spell)',fee:'Undisclosed',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Stoke City',player:'Josh Griffiths',age:23,from:'Portsmouth (loan spell)',fee:'Undisclosed',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Sheffield Wednesday',player:'Ricardo Santos',age:31,from:'Swansea City',fee:'Free',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Burnley',player:'Florentino',age:25,from:'Benfica',fee:'£20.7m',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Stoke City',player:'Ethan Galbraith',age:25,from:'Swansea City',fee:'£10m',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Southampton',player:'Daniel Peretz',age:25,from:'Bayern Munich',fee:'£6.9m',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Derby County',player:'Bobby Clark',age:21,from:'RB Salzburg',fee:'£6m',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Wolverhampton Wanderers',player:'Ladislav Krejci',age:25,from:'Girona',fee:'£6.5m',type:'in',date:'Jun 2026',status:'confirmed'},

  // ── CONFIRMED DEPARTURES ──────────────────────────────────────────────────
  {club:'Wolverhampton Wanderers',player:'Matt Doherty',age:33,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Middlesbrough',player:'Darragh Lenihan',age:34,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Middlesbrough',player:'Marcus Forss',age:26,to:'Brighton (parent club)',fee:'Loan ended',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Middlesbrough',player:'Alex Gilbert',age:24,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Middlesbrough',player:'Dan Barlaser',age:28,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Middlesbrough',player:'Sammy Silvera',age:25,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Middlesbrough',player:'Jon McLaughlin',age:38,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Millwall',player:'Billy Mitchell',age:25,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Millwall',player:'Danny McNamara',age:26,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Millwall',player:'Joe Bryan',age:31,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Millwall',player:'Massimo Luongo',age:33,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Millwall',player:'Ryan Leonard',age:32,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Millwall',player:'Wes Harding',age:29,to:'Plymouth Argyle',fee:'Free',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Derby County',player:'Ben Osborn',age:30,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Derby County',player:'Andi Weimann',age:34,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Portsmouth',player:'Andre Dozzell',age:27,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Portsmouth',player:'Jordan Archer',age:33,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'West Bromwich Albion',player:'John Swift',age:29,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'West Bromwich Albion',player:'Grady Diangana',age:27,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Cardiff City',player:'Ryan Wintle',age:28,to:'Free agent',fee:'Released',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Swansea City',player:'Ricardo Santos',age:31,to:'Sheffield Wednesday',fee:'Free',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Stoke City',player:'Lewis Baker',age:30,to:'Bursaspor (Turkey)',fee:'Free',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Charlton Athletic',player:'Josh Davison',age:25,to:'Shrewsbury Town',fee:'Undisclosed',type:'out',date:'26 Jun 2026',status:'confirmed'},
  {club:'Charlton Athletic',player:'Terry Taylor',age:25,to:'Stevenage',fee:'Free',type:'out',date:'26 Jun 2026',status:'confirmed'},
  {club:'Norwich City',player:'Tony Springett',age:22,to:'Leyton Orient',fee:'Undisclosed',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Leicester City',player:'Bilal El Khannouss',age:22,to:'VfB Stuttgart',fee:'Undisclosed',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Leicester City',player:'Jeremy Monga',age:17,to:'Arsenal',fee:'Undisclosed',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Leicester City',player:'Patson Daka',age:27,to:'Free agent (contract expired)',fee:'Released',type:'out',date:'1 Jul 2026',status:'confirmed'},
  {club:'Leicester City',player:'Wout Faes',age:27,to:'Free agent (contract expired)',fee:'Released',type:'out',date:'1 Jul 2026',status:'confirmed'},
  {club:'Oxford United',player:'Matt Ingram',age:32,to:'West Bromwich Albion',fee:'Undisclosed',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Oxford United',player:'Przemysław Płacheta',age:26,to:'Austin FC (MLS)',fee:'Undisclosed',type:'out',date:'Jun 2026',status:'confirmed'},

  // ── ADVANCED / IMMINENT ─────────────────────────────────────────────────
  {club:'Derby County',player:'Matt Targett',age:30,from:'Newcastle United',fee:'Free',type:'in',date:'Jun 2026',status:'advanced'},
  {club:'West Bromwich Albion',player:'Ben Brereton Díaz',age:27,from:'Southampton',fee:'TBC',type:'in',date:'Jun 2026',status:'advanced'},
  {club:'Sheffield Wednesday',player:'Sil Swinkels',age:22,from:'Aston Villa',fee:'Undisclosed',type:'in',date:'Jun 2026',status:'advanced'},
  {club:'Middlesbrough',player:'Hayden Hackney',age:23,to:'Everton',fee:'~£25m',type:'out',date:'Jun 2026',status:'advanced'},
  {club:'West Ham United',player:'Mateus Fernandes',age:21,to:'Tottenham Hotspur',fee:'~£85m',type:'out',date:'1 Jul 2026',status:'advanced'},

  // ── RUMOURS ─────────────────────────────────────────────────────────────
  {club:'Middlesbrough',player:'Morgan Whittaker',age:25,to:'Fulham / Bournemouth / Wolves',fee:'~£20m',type:'out',date:'Jun 2026',status:'rumour'},
  {club:'Millwall',player:'Femi Azeez',age:24,to:'PL clubs — £20m bid from Ipswich rejected',fee:'£30m (Millwall valuation)',type:'out',date:'Jun 2026',status:'rumour'},
  {club:'Wrexham AFC',player:'Callum Doyle',age:22,to:'Premier League interest (Man City buyback clause)',fee:'£7.5m+',type:'out',date:'Jun 2026',status:'rumour'},
  {club:'Wrexham AFC',player:'Josh Windass',age:32,to:'Rangers',fee:'TBC',type:'out',date:'Jun 2026',status:'rumour'},
  {club:'Swansea City',player:'Zan Vipotnik',age:24,to:'Leeds / Everton / Newcastle / Aston Villa',fee:'£15-25m asked',type:'out',date:'Jun 2026',status:'rumour'},
  {club:'Watford',player:'Imran Louza',age:27,to:'Everton / Fulham / Brighton',fee:'~£15m',type:'out',date:'Jun 2026',status:'rumour'},
  {club:'Watford',player:'Nestory Irankunda',age:20,to:'Everton / Bayer Leverkusen',fee:'TBC (Bayern 50% sell-on)',type:'out',date:'Jun 2026',status:'rumour'},
  {club:'West Ham United',player:'Jarrod Bowen',age:29,to:'Aston Villa',fee:'TBC',type:'out',date:'Jun 2026',status:'rumour'},
  {club:'West Ham United',player:'Crysencio Summerville',age:24,to:'Manchester United',fee:'TBC',type:'out',date:'Jun 2026',status:'rumour'},
  {club:'Southampton',player:'Tyler Dibling',age:20,to:'Multiple PL clubs circling',fee:'TBC',type:'out',date:'Jun 2026',status:'rumour'},
  {club:'Sheffield United',player:'Kalvin Phillips',age:30,from:'Available on free',fee:'TBC',type:'in',date:'Jun 2026',status:'rumour'},
  {club:'Derby County',player:'Thierry Small',age:21,from:'Charlton Athletic — chased by Blackburn &amp; Millwall too',fee:'TBC',type:'in',date:'Jun 2026',status:'rumour'},
  {club:'Wolverhampton Wanderers',player:'Johann Lepenant',age:23,from:'Improved £15m bid submitted',fee:'~£15m',type:'in',date:'Jun 2026',status:'rumour'},
  {club:'Oxford United',player:'Bamba Dieng',age:26,from:'Lorient (free agent) — also chased by Blackburn, Leicester, Portsmouth, St Pauli',fee:'Free',type:'in',date:'Jun 2026',status:'rumour'},

  // ── LEAGUE ONE — CONFIRMED ────────────────────────────────────────────────
  {club:'Bradford City',player:'Jon McCracken',age:26,from:'Dundee',fee:'Undisclosed',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Bradford City',player:'Callum Connolly',age:27,from:'Stockport County',fee:'Undisclosed',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Bradford City',player:'Matthew Pennington',age:31,from:'Ipswich Town',fee:'Undisclosed',type:'in',date:'25 Jun 2026',status:'confirmed'},
  {club:'Bradford City',player:'Curtis Tilt',age:33,to:'Burton Albion',fee:'Undisclosed',type:'out',date:'Jun 2026',status:'confirmed'},
  {club:'Blackpool',player:'Ilmari Niskanen',age:26,from:'Exeter City',fee:'Undisclosed',type:'in',date:'28 Jun 2026',status:'confirmed'},
  {club:'Mansfield Town',player:'David McGoldrick',age:38,from:'Barnsley (released)',fee:'Free',type:'in',date:'16 Jun 2026',status:'confirmed'},
  {club:'Barnsley',player:'Cameron McGeehan',age:31,from:'Northampton Town',fee:'Undisclosed',type:'in',date:'29 Jun 2026',status:'confirmed'},
  {club:'Plymouth Argyle',player:'Alex Hartridge',age:24,from:'Burton Albion',fee:'Undisclosed',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Doncaster Rovers',player:'Leon Ayinde',age:21,from:'Ipswich Town',fee:'Free',type:'in',date:'20 May 2026',status:'confirmed'},
  {club:'Reading',player:'Kyreece Lisbie',age:23,from:'Colchester United',fee:'Undisclosed (~£500k)',type:'in',date:'1 Jul 2026',status:'confirmed'},

  // ── LEAGUE TWO — CONFIRMED ────────────────────────────────────────────────
  {club:'Oldham Athletic',player:'Ollie Norburn',age:32,from:'Notts County',fee:'Undisclosed',type:'in',date:'15 Jun 2026',status:'confirmed'},
  {club:'Salford City',player:'Will Aimson',age:31,from:'Wigan Athletic',fee:'Free',type:'in',date:'23 Jun 2026',status:'confirmed'},
  {club:'Barnet',player:'Taye Ashby-Hammond',age:24,from:'Fulham',fee:'Free',type:'in',date:'1 Jul 2026',status:'confirmed'},
  {club:'Grimsby Town',player:'Andy Cook',age:35,from:'Bradford City',fee:'Free',type:'in',date:'1 Jul 2026',status:'confirmed'},
  {club:'Northampton Town',player:'Janoi Donacien',age:31,from:'Chesterfield',fee:'Free',type:'in',date:'26 Jun 2026',status:'confirmed'},
  {club:'Rotherham United',player:'Fábio Tavares',age:26,from:'Burton Albion',fee:'Free',type:'in',date:'1 Jul 2026',status:'confirmed'},
  {club:'Walsall',player:'Sven Sprangler',age:28,from:'St Johnstone',fee:'Undisclosed',type:'in',date:'27 Jun 2026',status:'confirmed'},
  {club:'Port Vale',player:'Jackson Smith',age:23,from:'Barnsley',fee:'Undisclosed',type:'in',date:'19 Jun 2026',status:'confirmed'},

  // ── NATIONAL LEAGUE — CONFIRMED ───────────────────────────────────────────
  {club:'AFC Fylde',player:'Cedric Main',age:27,from:'Darlington',fee:'Undisclosed',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Worthing',player:'Dom Hutchinson',age:26,from:'Wealdstone (ex-Watford academy)',fee:'Undisclosed',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Hornchurch',player:'Nathan Ferguson',age:30,from:'Hartlepool United',fee:'Undisclosed',type:'in',date:'Jun 2026',status:'confirmed'},
  {club:'Kidderminster Harriers',player:'Joe Foulkes',age:26,to:'Grimsby Town',fee:'Free',type:'out',date:'16 Jun 2026',status:'confirmed'},
];

function transfersPage() {
  const NAV = `<nav class="tab-nav"><a href="/" class="tab-link">📋 Weekly Doc</a><a href="/clubs" class="tab-link">🏟️ Club Guide</a><a href="/transfers" class="tab-link active">🔄 Transfers</a><a href="/clips" class="tab-link">🎬 Clips</a><a href="/plan" class="tab-link">📝 Show Plan</a></nav>`;

  const clubColour = (name) => {
    const match = Object.values(CLUBS).find(c => c.n === name || c.a === name);
    return match ? match.c : '#1B3A28';
  };
  const clubDark = (name) => {
    const match = Object.values(CLUBS).find(c => c.n === name || c.a === name);
    return match ? !!match.ck : false;
  };

  const badge = (name) => {
    const match = Object.values(CLUBS).find(c => c.n === name);
    const abbr = match ? match.a : name.substring(0,3).toUpperCase();
    const col = match ? match.c : '#1B3A28';
    const dark = match ? !!match.ck : false;
    return `<span class="t-badge" style="background:${col};color:${dark?'#111':'#fff'}">${abbr}</span>`;
  };

  const statusChip = (s) => {
    const map = { confirmed:'#00a651', advanced:'#f59e0b', rumour:'#6b7280' };
    const label = { confirmed:'Confirmed', advanced:'Advanced', rumour:'Rumour' };
    return `<span class="t-chip" style="background:${map[s]||'#6b7280'}">${label[s]||s}</span>`;
  };

  const ins = TRANSFERS.filter(t => t.type === 'in');
  const outs = TRANSFERS.filter(t => t.type === 'out');

  const renderRow = (t) => {
    const isIn = t.type === 'in';
    const arrow = isIn ? '<span class="t-arrow t-in">IN</span>' : '<span class="t-arrow t-out">OUT</span>';
    const move = isIn
      ? `<span class="t-from">${t.from}</span> → ${badge(t.club)} <span class="t-club">${t.club}</span>`
      : `${badge(t.club)} <span class="t-club">${t.club}</span> → <span class="t-from">${t.to}</span>`;
    return `<div class="t-row">
      ${arrow}
      <div class="t-player"><span class="t-name">${t.player}</span><span class="t-age">Age ${t.age}</span></div>
      <div class="t-move">${move}</div>
      <div class="t-meta">${t.fee ? `<span class="t-fee">${t.fee}</span>` : ''}${statusChip(t.status)}</div>
      ${t.date ? `<div class="t-date">${t.date}</div>` : ''}
    </div>`;
  };

  const groupByClub = (list) => {
    const map = {};
    list.forEach(t => {
      const key = t.club;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  };

  const renderSection = (title, list, colour) => {
    if (!list.length) return `<div class="t-empty">No ${title.toLowerCase()} to show yet — check back soon.</div>`;
    return list.map(renderRow).join('');
  };

  const allSorted = [...TRANSFERS].sort((a,b) => {
    const order = { confirmed:0, advanced:1, rumour:2 };
    return (order[a.status]||3) - (order[b.status]||3);
  });

  const confirmed = TRANSFERS.filter(t => t.status === 'confirmed');
  const advanced = TRANSFERS.filter(t => t.status === 'advanced');
  const rumours = TRANSFERS.filter(t => t.status === 'rumour');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Transfers — The Pyramid</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#f0f2ef;color:#111}
.hdr{background:linear-gradient(135deg,#0d2218 0%,#1B3A28 100%);border-bottom:4px solid #C9A84C;padding:20px 32px;display:flex;align-items:center;gap:20px;animation:fadeDown .4s ease}
.hdr-icon{font-size:36px;color:#C9A84C;line-height:1;flex-shrink:0}
.hdr-text h1{font-size:26px;font-weight:900;color:#C9A84C;text-transform:uppercase;letter-spacing:1.5px}
.hdr-text .sub{font-size:14px;color:rgba(255,255,255,0.6);margin-top:2px;font-weight:500}
.tab-nav{background:#fff;border-bottom:2px solid #e8e8e8;display:flex;padding:0 32px;overflow-x:auto}
.tab-link{display:inline-block;padding:13px 20px;font-size:13px;font-weight:700;color:#666;text-decoration:none;border-bottom:3px solid transparent;margin-bottom:-2px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;transition:color .2s,border-bottom-color .25s}
.tab-link:hover{color:#1B3A28;border-bottom-color:rgba(201,168,76,0.5)}
.tab-link.active{color:#1B3A28;border-bottom-color:#C9A84C}
.page{max-width:860px;margin:0 auto;padding:0 24px 60px}
.t-section-hdr{font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:#fff;padding:10px 20px;border-radius:4px 4px 0 0;margin-top:24px}
.t-section-hdr.confirmed{background:#00a651}.t-section-hdr.advanced{background:#f59e0b}.t-section-hdr.rumour{background:#6b7280}
.t-block{background:#fff;border-radius:0 0 6px 6px;border:1px solid #e8e8e8;border-top:none;margin-bottom:8px;overflow:hidden}
.t-row{display:grid;grid-template-columns:52px 1fr 2fr 1fr auto;align-items:center;gap:12px;padding:13px 18px;border-bottom:1px solid #f2f2f2;transition:background .15s}
.t-row:last-child{border-bottom:none}
.t-row:hover{background:#f5faf7}
.t-arrow{font-size:10px;font-weight:900;letter-spacing:1px;padding:3px 7px;border-radius:3px;text-align:center}
.t-in{background:#dcfce7;color:#15803d}.t-out{background:#fee2e2;color:#b91c1c}
.t-player{display:flex;flex-direction:column;gap:2px}
.t-name{font-size:15px;font-weight:800;color:#111}
.t-age{font-size:12px;color:#888;font-weight:500}
.t-move{font-size:13px;color:#444;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.t-badge{font-size:9px;font-weight:900;padding:2px 6px;border-radius:3px;letter-spacing:0.5px;text-transform:uppercase}
.t-club{font-weight:700;color:#111}
.t-from{color:#666;font-style:italic}
.t-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.t-fee{font-size:12px;font-weight:700;background:#f0f0f0;padding:2px 8px;border-radius:3px;color:#333}
.t-chip{font-size:10px;font-weight:800;padding:2px 8px;border-radius:3px;color:#fff;text-transform:uppercase;letter-spacing:0.5px}
.t-date{font-size:11px;color:#aaa;white-space:nowrap}
.t-empty{padding:28px 24px;color:#999;font-size:14px;font-style:italic;background:#fff;border-radius:0 0 6px 6px;border:1px solid #e8e8e8;border-top:none}
.t-updated{font-size:12px;color:#aaa;text-align:right;padding:12px 0 4px}
@media(max-width:640px){.t-row{grid-template-columns:44px 1fr;grid-template-rows:auto auto auto}.t-move{grid-column:1/-1}.t-meta{grid-column:1/-1}.t-date{display:none}}
footer{text-align:center;color:#bbb;font-size:12px;padding:24px 0;border-top:2px solid #1B3A28;margin:0 32px}
@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
</style></head><body>
<div class="hdr"><div class="hdr-icon">▲</div><div class="hdr-text"><h1>The Pyramid</h1><div class="sub">Transfers · Summer 2026</div></div></div>
${NAV}
<div class="page">
<p class="t-updated">Updated: June 2026 · Championship only · Confirmed, advanced & rumours</p>

<div class="t-section-hdr confirmed">✅ Confirmed</div>
<div class="t-block">${renderSection('confirmed signings', confirmed, '#00a651')}</div>

<div class="t-section-hdr advanced">⏳ Advanced / Imminent</div>
<div class="t-block">${renderSection('advanced deals', advanced, '#f59e0b')}</div>

<div class="t-section-hdr rumour">💬 Rumours</div>
<div class="t-block">${renderSection('rumours', rumours, '#6b7280')}</div>

</div>
<footer>The Pyramid · Transfers · Summer 2026</footer>
</body></html>`;
}

function clipsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Clip Tracker — EFL Pod</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f0f2ef;color:#111;font-size:15px;line-height:1.5}
.hdr{background:linear-gradient(135deg,#0d2218 0%,#1B3A28 100%);border-bottom:4px solid #C9A84C;padding:20px 32px;display:flex;align-items:center;gap:20px;animation:fadeDown .4s ease}
.hdr-icon{font-size:36px;color:#C9A84C;line-height:1;flex-shrink:0}
.hdr-text h1{font-size:26px;font-weight:900;color:#C9A84C;text-transform:uppercase;letter-spacing:1.5px}
.hdr-text .sub{font-size:14px;color:rgba(255,255,255,0.6);margin-top:2px;font-weight:500}
.tab-nav{background:#fff;border-bottom:2px solid #e8e8e8;display:flex;padding:0 32px;overflow-x:auto}
.tab-link{display:inline-block;padding:13px 20px;font-size:13px;font-weight:700;color:#666;text-decoration:none;border-bottom:3px solid transparent;margin-bottom:-2px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;transition:color .2s,border-bottom-color .25s}
.tab-link:hover{color:#1B3A28;border-bottom-color:rgba(201,168,76,0.5)}
.tab-link.active{color:#1B3A28;border-bottom-color:#C9A84C}
.page{max-width:1100px;margin:0 auto;padding:24px 24px 60px}

.stat-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px}
.stat-card{background:#fff;border-radius:8px;padding:16px 18px;border:1px solid #e8e8e8}
.stat-card .num{font-size:24px;font-weight:900;color:#1B3A28}
.stat-card .lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#888;margin-top:2px}

.platform-bars{background:#fff;border-radius:8px;padding:18px 20px;border:1px solid #e8e8e8;margin-bottom:20px}
.platform-bars h3,.section-hdr{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#1B3A28;margin-bottom:12px}
.pbar-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:13px}
.pbar-row .pname{width:90px;font-weight:700;flex-shrink:0}
.pbar-track{flex:1;background:#f0f0f0;border-radius:4px;height:16px;overflow:hidden}
.pbar-fill{height:100%;border-radius:4px}
.pbar-row .pval{width:90px;text-align:right;font-weight:700;color:#333;flex-shrink:0}

.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px}
.toolbar input[type=text]{flex:1;min-width:180px;padding:10px 14px;border-radius:6px;border:1px solid #ddd;font-size:14px;font-family:inherit}
.toolbar select{padding:10px 12px;border-radius:6px;border:1px solid #ddd;font-size:13px;background:#fff;font-family:inherit}
.btn-primary{background:#1B3A28;color:#fff;border:none;padding:11px 18px;border-radius:6px;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap}
.btn-primary:hover{background:#264d36}

.section{background:#fff;border-radius:8px;border:1px solid #e8e8e8;margin-bottom:20px;overflow:hidden}
.section-inner{padding:18px 20px}
.review-item{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 0;border-top:1px solid #f0f0f0}
.review-item:first-child{border-top:none}
.review-item .rtitle{flex:1;min-width:160px;font-weight:700}
.review-item .rmeta{font-size:12px;color:#888}
.review-item input[type=number]{width:80px;padding:6px 8px;border-radius:4px;border:1px solid #ddd;font-size:13px}
.review-item .rplat{font-size:10px;font-weight:800;text-transform:uppercase;color:#888;display:block;margin-bottom:2px}
.review-item button{background:#C9A84C;color:#1B3A28;border:none;padding:8px 14px;border-radius:5px;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap}

table.clip-table{width:100%;border-collapse:collapse;font-size:13px}
table.clip-table th{text-align:left;padding:10px 12px;background:#f7f8f6;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:#666;border-bottom:2px solid #e8e8e8;white-space:nowrap}
table.clip-table td{padding:10px 12px;border-bottom:1px solid #f0f0f0;vertical-align:middle}
table.clip-table tr:hover td{background:#f5faf7}
.rank-pill{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#f0f0f0;font-weight:900;font-size:11px;color:#666}
.rank-pill.gold{background:#C9A84C;color:#1B3A28}
.clip-title{font-weight:700}
.topic-chip{background:#eef3ef;color:#1B3A28;font-size:11px;font-weight:700;padding:2px 9px;border-radius:12px;white-space:nowrap}
.total-cell{font-weight:900;color:#1B3A28}
.best-badge{font-size:11px;font-weight:800;padding:2px 8px;border-radius:10px;white-space:nowrap}
.row-actions button{border:none;background:none;color:#888;font-size:12px;font-weight:700;cursor:pointer;padding:2px 5px}
.row-actions button:hover{color:#1B3A28}
.empty-msg{text-align:center;color:#999;padding:30px;font-size:14px}

.topic-table{width:100%;border-collapse:collapse;font-size:13px}
.topic-table th{text-align:left;padding:8px 12px;font-size:10px;font-weight:900;text-transform:uppercase;color:#666;border-bottom:2px solid #e8e8e8}
.topic-table td{padding:8px 12px;border-bottom:1px solid #f0f0f0}

#modalOverlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);display:none;align-items:center;justify-content:center;z-index:500;padding:20px}
#modal{background:#fff;border-radius:12px;padding:26px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto}
#modal h2{font-size:19px;font-weight:900;margin-bottom:16px;color:#1B3A28}
#modal label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#666;display:block;margin:12px 0 5px}
#modal input,#modal select,#modal textarea{width:100%;padding:9px 12px;border-radius:6px;border:1px solid #ddd;font-family:inherit;font-size:14px}
#modal textarea{min-height:60px;resize:vertical}
.plat-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
.plat-block{border-top:1px solid #f0f0f0;padding-top:10px;margin-top:10px}
.plat-block h4{font-size:11px;font-weight:900;text-transform:uppercase;color:#888;margin-bottom:6px}
.plat-block .row2{display:flex;gap:8px}
.check-row{display:flex;align-items:center;gap:8px;margin-top:14px}
.check-row input{width:auto}
.modal-actions{display:flex;gap:10px;margin-top:20px}
.modal-actions button{flex:1;padding:12px;border-radius:8px;font-weight:800;font-size:14px;cursor:pointer;border:none}
.modal-actions .save{background:#1B3A28;color:#fff}
.modal-actions .cancel{background:#eee;color:#333}
.modal-actions .cancel.danger{background:#f8d7da;color:#c0392b}
footer{text-align:center;color:#bbb;font-size:12px;padding:24px 0;border-top:2px solid #1B3A28;margin:0 32px}
@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
</style>
</head>
<body>
<div class="hdr">
  <div class="hdr-icon">🎬</div>
  <div class="hdr-text"><h1>Clip Tracker</h1><div class="sub">Every short across X, YouTube, Instagram &amp; TikTok — see what actually performs</div></div>
</div>
<nav class="tab-nav"><a href="/" class="tab-link">📋 Weekly Doc</a><a href="/clubs" class="tab-link">🏟️ Club Guide</a><a href="/transfers" class="tab-link">🔄 Transfers</a><a href="/clips" class="tab-link active">🎬 Clips</a><a href="/plan" class="tab-link">📝 Show Plan</a></nav>

<div class="page">

  <div class="stat-row" id="statRow"></div>

  <div class="platform-bars">
    <h3>Platform Totals (All Time)</h3>
    <div id="platBars"></div>
  </div>

  <div class="section" id="reviewSection" style="display:none">
    <div class="section-inner">
      <div class="section-hdr">⏳ Awaiting Review — enter this week's views</div>
      <div id="reviewList"></div>
    </div>
  </div>

  <div class="toolbar">
    <input type="text" id="searchBox" placeholder="Search clips...">
    <select id="topicFilter"><option value="">All Topics</option></select>
    <select id="sortBy">
      <option value="total">Sort: Total Views</option>
      <option value="date">Sort: Newest</option>
      <option value="views_x">Sort: X Views</option>
      <option value="views_youtube">Sort: YouTube Views</option>
      <option value="views_instagram">Sort: Instagram Views</option>
      <option value="views_tiktok">Sort: TikTok Views</option>
    </select>
    <button class="btn-primary" onclick="openModal()">+ Add Clip</button>
  </div>

  <div class="section">
    <div class="section-inner" style="overflow-x:auto">
      <div class="section-hdr">🏆 Leaderboard</div>
      <table class="clip-table" id="clipTable">
        <thead><tr>
          <th>#</th><th>Clip</th><th>Topic</th><th>Posted</th>
          <th>X</th><th>YouTube</th><th>Instagram</th><th>TikTok</th><th>Total</th><th>Best</th><th></th>
        </tr></thead>
        <tbody id="clipRows"></tbody>
      </table>
      <div class="empty-msg" id="emptyMsg" style="display:none">No clips match your filters.</div>
    </div>
  </div>

  <div class="section" id="topicSection" style="display:none">
    <div class="section-inner">
      <div class="section-hdr">📊 Performance by Topic</div>
      <table class="topic-table" id="topicTable"></table>
    </div>
  </div>

</div>

<div id="modalOverlay">
  <div id="modal">
    <h2 id="modalTitle">Add Clip</h2>
    <input type="hidden" id="clipId">
    <label>Title / description</label>
    <input id="fTitle" type="text" placeholder="e.g. Deeney vs Pukki hot take">
    <label>Topic / category</label>
    <input id="fTopic" type="text" list="topicList" placeholder="e.g. hot take, transfer news, goal of the week">
    <datalist id="topicList"></datalist>
    <label>Posted date</label>
    <input id="fDate" type="date">

    <div class="plat-grid">
      <div class="plat-block">
        <h4>𝕏 (Twitter)</h4>
        <input id="fLinkX" type="text" placeholder="Link (optional)">
        <div class="row2"><input id="fViewsX" type="number" min="0" placeholder="Views" style="margin-top:6px"></div>
      </div>
      <div class="plat-block">
        <h4>YouTube Shorts</h4>
        <input id="fLinkYoutube" type="text" placeholder="Link (optional)">
        <div class="row2"><input id="fViewsYoutube" type="number" min="0" placeholder="Views" style="margin-top:6px"></div>
      </div>
      <div class="plat-block">
        <h4>Instagram Reels</h4>
        <input id="fLinkInstagram" type="text" placeholder="Link (optional)">
        <div class="row2"><input id="fViewsInstagram" type="number" min="0" placeholder="Views" style="margin-top:6px"></div>
      </div>
      <div class="plat-block">
        <h4>TikTok</h4>
        <input id="fLinkTiktok" type="text" placeholder="Link (optional)">
        <div class="row2"><input id="fViewsTiktok" type="number" min="0" placeholder="Views" style="margin-top:6px"></div>
      </div>
    </div>

    <label>Notes</label>
    <textarea id="fNotes" placeholder="Anything worth remembering — hook used, why it worked/flopped, etc."></textarea>

    <div class="check-row"><input type="checkbox" id="fReviewed"><label style="margin:0;text-transform:none;font-size:13px;font-weight:600;color:#333">Stats entered / reviewed</label></div>

    <div class="modal-actions">
      <button class="cancel" onclick="closeModal()">Cancel</button>
      <button class="save" onclick="saveClip()">Save</button>
    </div>
    <div class="modal-actions" id="deleteRow" style="display:none">
      <button class="cancel danger" style="flex:none;width:100%" onclick="deleteClip()">Delete Clip</button>
    </div>
  </div>
</div>

<footer>Clip Tracker · EFL Pod</footer>

<script>
var PLATFORMS = [
  { key: 'x', field: 'views_x', linkField: 'link_x', label: 'X', color: '#111' },
  { key: 'youtube', field: 'views_youtube', linkField: 'link_youtube', label: 'YouTube', color: '#FF0000' },
  { key: 'instagram', field: 'views_instagram', linkField: 'link_instagram', label: 'Instagram', color: '#C13584' },
  { key: 'tiktok', field: 'views_tiktok', linkField: 'link_tiktok', label: 'TikTok', color: '#FE2C55' }
];
var clips = [];

function esc(s){
  return (s || '').toString().replace(/[&<>"']/g, function(c){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}
function fmtNum(n){ return (n || 0).toLocaleString('en-GB'); }
function totalViews(c){ return (c.views_x||0)+(c.views_youtube||0)+(c.views_instagram||0)+(c.views_tiktok||0); }
function bestPlatform(c){
  var best = null, bestVal = -1;
  PLATFORMS.forEach(function(p){
    var v = c[p.field] || 0;
    if (v > bestVal) { bestVal = v; best = p; }
  });
  return bestVal > 0 ? best : null;
}

function loadClips(){
  fetch('/api/clips').then(function(r){ return r.json(); }).then(function(data){
    clips = data;
    renderStats();
    renderPlatformBars();
    renderTopicFilter();
    renderReviewSection();
    renderTopicBreakdown();
    render();
  });
}

function renderStats(){
  var total = clips.length;
  var totalV = clips.reduce(function(s,c){ return s + totalViews(c); }, 0);
  var avg = total ? Math.round(totalV / total) : 0;
  var platTotals = {};
  PLATFORMS.forEach(function(p){ platTotals[p.key] = clips.reduce(function(s,c){ return s + (c[p.field]||0); }, 0); });
  var bestPlatKey = null, bestPlatVal = -1;
  PLATFORMS.forEach(function(p){ if (platTotals[p.key] > bestPlatVal) { bestPlatVal = platTotals[p.key]; bestPlatKey = p.label; } });
  var topClip = clips.slice().sort(function(a,b){ return totalViews(b) - totalViews(a); })[0];

  document.getElementById('statRow').innerHTML =
    '<div class="stat-card"><div class="num">' + total + '</div><div class="lbl">Total Clips</div></div>' +
    '<div class="stat-card"><div class="num">' + fmtNum(totalV) + '</div><div class="lbl">Total Views</div></div>' +
    '<div class="stat-card"><div class="num">' + fmtNum(avg) + '</div><div class="lbl">Avg Views / Clip</div></div>' +
    '<div class="stat-card"><div class="num" style="font-size:18px">' + (bestPlatKey || '—') + '</div><div class="lbl">Top Platform</div></div>' +
    '<div class="stat-card"><div class="num" style="font-size:15px">' + (topClip ? esc(topClip.title) : '—') + '</div><div class="lbl">Best Performing Clip</div></div>';
}

function renderPlatformBars(){
  var totals = PLATFORMS.map(function(p){ return { p: p, val: clips.reduce(function(s,c){ return s + (c[p.field]||0); }, 0) }; });
  var max = Math.max.apply(null, totals.map(function(t){ return t.val; }).concat([1]));
  document.getElementById('platBars').innerHTML = totals.map(function(t){
    var pct = Math.round((t.val / max) * 100);
    return '<div class="pbar-row"><div class="pname">' + t.p.label + '</div><div class="pbar-track"><div class="pbar-fill" style="width:' + pct + '%;background:' + t.p.color + '"></div></div><div class="pval">' + fmtNum(t.val) + '</div></div>';
  }).join('');
}

function renderTopicFilter(){
  var topics = [];
  clips.forEach(function(c){ if (c.topic && topics.indexOf(c.topic) === -1) topics.push(c.topic); });
  topics.sort();
  var sel = document.getElementById('topicFilter');
  var current = sel.value;
  sel.innerHTML = '<option value="">All Topics</option>' + topics.map(function(t){ return '<option value="' + esc(t) + '">' + esc(t) + '</option>'; }).join('');
  sel.value = current;
  document.getElementById('topicList').innerHTML = topics.map(function(t){ return '<option value="' + esc(t) + '">'; }).join('');
}

function renderReviewSection(){
  var pending = clips.filter(function(c){ return !c.reviewed; });
  var section = document.getElementById('reviewSection');
  if (!pending.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  document.getElementById('reviewList').innerHTML = pending.map(function(c){
    var inputs = PLATFORMS.map(function(p){
      return '<div><span class="rplat">' + p.label + '</span><input type="number" min="0" id="rv_' + p.key + '_' + c.id + '" value="' + (c[p.field] || 0) + '"></div>';
    }).join('');
    return '<div class="review-item">' +
      '<div class="rtitle">' + esc(c.title) + '<div class="rmeta">' + esc(c.topic || 'no topic') + ' · posted ' + esc(c.posted_date) + '</div></div>' +
      inputs +
      '<button onclick="saveReview(' + c.id + ')">Save &amp; Mark Reviewed</button>' +
      '</div>';
  }).join('');
}

function saveReview(id){
  var c = clips.find(function(x){ return x.id === id; });
  if (!c) return;
  var payload = Object.assign({}, c);
  PLATFORMS.forEach(function(p){
    var el = document.getElementById('rv_' + p.key + '_' + id);
    payload[p.field] = parseInt(el.value, 10) || 0;
  });
  payload.reviewed = 1;
  fetch('/api/clips/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(function(){ loadClips(); });
}

function renderTopicBreakdown(){
  var byTopic = {};
  clips.forEach(function(c){
    var t = c.topic || '(no topic)';
    if (!byTopic[t]) byTopic[t] = [];
    byTopic[t].push(c);
  });
  var topics = Object.keys(byTopic);
  var section = document.getElementById('topicSection');
  if (!topics.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  var rows = topics.map(function(t){
    var list = byTopic[t];
    var totals = list.map(totalViews);
    var sum = totals.reduce(function(a,b){ return a+b; }, 0);
    var avg = Math.round(sum / list.length);
    var best = list.slice().sort(function(a,b){ return totalViews(b)-totalViews(a); })[0];
    return { t: t, count: list.length, avg: avg, best: best };
  }).sort(function(a,b){ return b.avg - a.avg; });
  document.getElementById('topicTable').innerHTML =
    '<thead><tr><th>Topic</th><th>Clips</th><th>Avg Views</th><th>Best Clip</th></tr></thead><tbody>' +
    rows.map(function(r){
      return '<tr><td>' + esc(r.t) + '</td><td>' + r.count + '</td><td>' + fmtNum(r.avg) + '</td><td>' + esc(r.best.title) + ' (' + fmtNum(totalViews(r.best)) + ')</td></tr>';
    }).join('') + '</tbody>';
}

function render(){
  var q = document.getElementById('searchBox').value.toLowerCase();
  var topic = document.getElementById('topicFilter').value;
  var sortBy = document.getElementById('sortBy').value;

  var filtered = clips.filter(function(c){
    if (topic && c.topic !== topic) return false;
    if (q && (c.title || '').toLowerCase().indexOf(q) === -1) return false;
    return true;
  });

  filtered.sort(function(a,b){
    if (sortBy === 'date') return (b.posted_date || '').localeCompare(a.posted_date || '');
    if (sortBy === 'total') return totalViews(b) - totalViews(a);
    return (b[sortBy] || 0) - (a[sortBy] || 0);
  });

  var tbody = document.getElementById('clipRows');
  document.getElementById('emptyMsg').style.display = filtered.length ? 'none' : 'block';

  tbody.innerHTML = filtered.map(function(c, i){
    var best = bestPlatform(c);
    var bestBadge = best ? '<span class="best-badge" style="background:' + best.color + '22;color:' + best.color + '">' + best.label + '</span>' : '—';
    var rankClass = i === 0 && sortBy === 'total' ? 'rank-pill gold' : 'rank-pill';
    return '<tr>' +
      '<td><span class="' + rankClass + '">' + (i+1) + '</span></td>' +
      '<td class="clip-title">' + esc(c.title) + (c.reviewed ? '' : ' <span style="color:#C9A84C;font-size:11px;font-weight:800">●&nbsp;pending</span>') + '</td>' +
      '<td>' + (c.topic ? '<span class="topic-chip">' + esc(c.topic) + '</span>' : '') + '</td>' +
      '<td>' + esc(c.posted_date) + '</td>' +
      '<td>' + fmtNum(c.views_x) + '</td>' +
      '<td>' + fmtNum(c.views_youtube) + '</td>' +
      '<td>' + fmtNum(c.views_instagram) + '</td>' +
      '<td>' + fmtNum(c.views_tiktok) + '</td>' +
      '<td class="total-cell">' + fmtNum(totalViews(c)) + '</td>' +
      '<td>' + bestBadge + '</td>' +
      '<td class="row-actions"><button onclick="openModal(' + c.id + ')">Edit</button></td>' +
      '</tr>';
  }).join('');
}

document.getElementById('searchBox').addEventListener('input', render);
document.getElementById('topicFilter').addEventListener('change', render);
document.getElementById('sortBy').addEventListener('change', render);

function openModal(id){
  document.getElementById('modalTitle').textContent = id ? 'Edit Clip' : 'Add Clip';
  document.getElementById('clipId').value = id || '';
  document.getElementById('deleteRow').style.display = id ? 'flex' : 'none';
  if (id) {
    var c = clips.find(function(x){ return x.id === id; });
    document.getElementById('fTitle').value = c.title || '';
    document.getElementById('fTopic').value = c.topic || '';
    document.getElementById('fDate').value = c.posted_date || '';
    document.getElementById('fNotes').value = c.notes || '';
    document.getElementById('fReviewed').checked = !!c.reviewed;
    PLATFORMS.forEach(function(p){
      document.getElementById('fLink' + p.key.charAt(0).toUpperCase() + p.key.slice(1)).value = c[p.linkField] || '';
      document.getElementById('fViews' + p.key.charAt(0).toUpperCase() + p.key.slice(1)).value = c[p.field] || '';
    });
  } else {
    document.getElementById('fTitle').value = '';
    document.getElementById('fTopic').value = '';
    document.getElementById('fDate').value = new Date().toISOString().slice(0,10);
    document.getElementById('fNotes').value = '';
    document.getElementById('fReviewed').checked = false;
    PLATFORMS.forEach(function(p){
      document.getElementById('fLink' + p.key.charAt(0).toUpperCase() + p.key.slice(1)).value = '';
      document.getElementById('fViews' + p.key.charAt(0).toUpperCase() + p.key.slice(1)).value = '';
    });
  }
  document.getElementById('modalOverlay').style.display = 'flex';
}
function closeModal(){ document.getElementById('modalOverlay').style.display = 'none'; }

function saveClip(){
  var id = document.getElementById('clipId').value;
  var payload = {
    title: document.getElementById('fTitle').value,
    topic: document.getElementById('fTopic').value,
    posted_date: document.getElementById('fDate').value,
    notes: document.getElementById('fNotes').value,
    reviewed: document.getElementById('fReviewed').checked ? 1 : 0
  };
  PLATFORMS.forEach(function(p){
    var cap = p.key.charAt(0).toUpperCase() + p.key.slice(1);
    payload[p.linkField] = document.getElementById('fLink' + cap).value;
    payload[p.field] = parseInt(document.getElementById('fViews' + cap).value, 10) || 0;
  });
  if (!payload.title.trim()) { alert('Title is required'); return; }
  var url = id ? '/api/clips/' + id : '/api/clips';
  var method = id ? 'PUT' : 'POST';
  fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(function(){ closeModal(); loadClips(); });
}

function deleteClip(){
  var id = document.getElementById('clipId').value;
  if (!id || !confirm('Delete this clip? This cannot be undone.')) return;
  fetch('/api/clips/' + id, { method: 'DELETE' }).then(function(){ closeModal(); loadClips(); });
}

loadClips();
</script>
</body></html>`;
}

function clubsPage() {
  const divOrder = ['Championship','League One','League Two','National League','National League North','National League South'];
  const divColour = {'Championship':'#1B3A28','League One':'#26523A','League Two':'#2E6046','National League':'#3a4a3f','National League North':'#4a5a4f','National League South':'#545f58'};
  let sections = '';
  for (const div of divOrder) {
    const clubs = Object.entries(CLUBS).filter(([,v]) => v.div === div);
    if (!clubs.length) continue;
    sections += `<div class="cl-section"><div class="cl-div-hdr" style="background:${divColour[div]}">${div}</div><div class="cl-grid">`;
    for (const [slug, club] of clubs) {
      const dk = club.ck ? 'color:#111' : 'color:#fff';
      sections += `<a href="/club/${slug}" class="cl-card"><span class="cl-badge" style="background:${club.c};${dk}">${club.a}</span><span class="cl-name">${club.n}</span><span class="cl-city">${club.city}</span></a>`;
    }
    sections += `</div></div>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Club Guide — The Pyramid</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#f0f2ef;color:#111}.hdr{background:linear-gradient(135deg,#0d2218 0%,#1B3A28 100%);border-bottom:4px solid #C9A84C;padding:20px 32px;display:flex;align-items:center;gap:20px;animation:fadeDown .4s ease}.hdr-icon{font-size:36px;color:#C9A84C;line-height:1;flex-shrink:0}.hdr-text h1{font-size:26px;font-weight:900;color:#C9A84C;text-transform:uppercase;letter-spacing:1.5px}.hdr-text .sub{font-size:14px;color:rgba(255,255,255,0.6);margin-top:2px;font-weight:500}.tab-nav{background:#fff;border-bottom:2px solid #e8e8e8;display:flex;padding:0 32px;overflow-x:auto}.tab-link{display:inline-block;padding:13px 20px;font-size:13px;font-weight:700;color:#666;text-decoration:none;border-bottom:3px solid transparent;margin-bottom:-2px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;transition:color .2s,border-bottom-color .25s}.tab-link:hover{color:#1B3A28;border-bottom-color:rgba(201,168,76,0.5)}.tab-link.active{color:#1B3A28;border-bottom-color:#C9A84C}.page{max-width:900px;margin:0 auto;padding:0 24px 60px}.cl-section{margin-top:28px}.cl-div-hdr{color:#fff;font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:2px;padding:14px 24px}.cl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;padding:16px 0}.cl-card{background:#fff;border-radius:8px;padding:14px 16px;display:flex;flex-direction:column;gap:6px;text-decoration:none;color:#111;border:1px solid #e8e8e8;transition:transform .2s cubic-bezier(.2,.8,.3,1.1),box-shadow .2s,border-color .2s}.cl-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(27,58,40,0.12);border-color:#1B3A28}.cl-badge{display:inline-flex;align-items:center;justify-content:center;width:44px;height:28px;border-radius:4px;font-size:10px;font-weight:900;letter-spacing:0.5px;text-transform:uppercase}.cl-name{font-size:14px;font-weight:800;color:#111;line-height:1.3}.cl-city{font-size:12px;color:#888}footer{text-align:center;color:#bbb;font-size:12px;padding:24px 0;border-top:2px solid #1B3A28;margin:0 32px}@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}</style></head><body>
<div class="hdr"><div class="hdr-icon">▲</div><div class="hdr-text"><h1>The Pyramid</h1><div class="sub">Club Guide · EFL &amp; Non-League</div></div></div>
<nav class="tab-nav"><a href="/" class="tab-link">📋 Weekly Doc</a><a href="/clubs" class="tab-link active">🏟️ Club Guide</a><a href="/transfers" class="tab-link">🔄 Transfers</a><a href="/clips" class="tab-link">🎬 Clips</a><a href="/plan" class="tab-link">📝 Show Plan</a></nav>
<div class="page">${sections}</div>
<footer>The Pyramid · Club Guide · Championship to National League South</footer>
</body></html>`;
}

function clubPage(slug) {
  const club = CLUBS[slug];
  if (!club) return `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="font-family:sans-serif;padding:40px"><h1>Club not found</h1><p><a href="/clubs">Back to Club Guide</a></p></body></html>`;
  const dk = club.ck ? 'color:#111' : 'color:#fff';
  const honoursList = (club.honours||[]).map(h=>`<li>${h}</li>`).join('');
  const legendsList = (club.legends||[]).map(l=>`<li>${l}</li>`).join('');
  const historyList = (club.history||[]).map(h=>`<li>${h}</li>`).join('');
  const rivalsList = (club.rivals||[]).join(', ');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${club.n} — The Pyramid</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#f0f2ef;color:#111}.hdr{background:linear-gradient(135deg,#0d2218 0%,#1B3A28 100%);border-bottom:4px solid #C9A84C;padding:20px 32px;display:flex;align-items:center;gap:20px;animation:fadeDown .4s ease}.hdr-icon{font-size:36px;color:#C9A84C;line-height:1;flex-shrink:0}.hdr-text h1{font-size:26px;font-weight:900;color:#C9A84C;text-transform:uppercase;letter-spacing:1.5px}.hdr-text .sub{font-size:14px;color:rgba(255,255,255,0.6);margin-top:2px;font-weight:500}.tab-nav{background:#fff;border-bottom:2px solid #e8e8e8;display:flex;padding:0 32px;overflow-x:auto}.tab-link{display:inline-block;padding:13px 20px;font-size:13px;font-weight:700;color:#666;text-decoration:none;border-bottom:3px solid transparent;margin-bottom:-2px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;transition:color .2s,border-bottom-color .25s}.tab-link:hover{color:#1B3A28;border-bottom-color:rgba(201,168,76,0.5)}.tab-link.active{color:#1B3A28;border-bottom-color:#C9A84C}.page{max-width:900px;margin:0 auto;padding:0 24px 60px}.club-hero{padding:32px;display:flex;align-items:center;gap:24px}.club-badge-lg{width:72px;height:72px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;background:rgba(255,255,255,0.15);letter-spacing:1px;flex-shrink:0}.club-hero h2{font-size:32px;font-weight:900;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.3)}.club-nick{font-size:16px;color:rgba(255,255,255,0.8);margin-top:4px}.club-div-chip{display:inline-block;background:rgba(255,255,255,0.2);color:#fff;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:4px 12px;border-radius:3px;margin-top:8px}.back-link{display:inline-flex;align-items:center;gap:6px;color:#1B3A28;text-decoration:none;font-size:13px;font-weight:700;padding:16px 0 4px;transition:color .2s}.back-link:hover{color:#C9A84C;text-decoration:underline}.cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px 0 0}@media(max-width:600px){.cards{grid-template-columns:1fr}}.card{background:#fff;border-radius:8px;padding:20px 22px;border:1px solid #e8e8e8;transition:box-shadow .2s}.card:hover{box-shadow:0 4px 16px rgba(27,58,40,0.08)}.card-full{grid-column:1/-1}.card h3{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.2px;color:#1B3A28;border-bottom:2px solid #C9A84C;padding-bottom:7px;margin-bottom:12px}.card p,.card li{font-size:15px;color:#333;line-height:1.7}.card ul{padding-left:18px}.card li{margin-bottom:4px}.stat-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f0f0f0;font-size:14px}.stat-row:last-child{border-bottom:none}.stat-label{color:#888;font-weight:600}.stat-value{color:#111;font-weight:700;text-align:right;max-width:60%}footer{text-align:center;color:#bbb;font-size:12px;padding:24px 0;border-top:2px solid #1B3A28;margin:0 32px}@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}</style></head><body>
<div class="hdr"><div class="hdr-icon">▲</div><div class="hdr-text"><h1>The Pyramid</h1><div class="sub">Club Guide · ${club.n}</div></div></div>
<nav class="tab-nav"><a href="/" class="tab-link">📋 Weekly Doc</a><a href="/clubs" class="tab-link active">🏟️ Club Guide</a><a href="/transfers" class="tab-link">🔄 Transfers</a><a href="/clips" class="tab-link">🎬 Clips</a><a href="/plan" class="tab-link">📝 Show Plan</a></nav>
<div class="club-hero" style="background:${club.c}"><div class="club-badge-lg" style="${dk}">${club.a}</div>
<div><h2>${club.n}</h2><div class="club-nick">${club.nick||''}</div><div class="club-div-chip">${club.div}</div></div></div>
<div class="page"><a href="/clubs" class="back-link">← Back to Club Guide</a>
<div class="cards">
<div class="card card-full"><h3>About</h3><p>${club.bio}</p></div>
<div class="card"><h3>Club Facts</h3>
<div class="stat-row"><span class="stat-label">Founded</span><span class="stat-value">${club.founded}</span></div>
<div class="stat-row"><span class="stat-label">Ground</span><span class="stat-value">${club.ground||'—'}</span></div>
<div class="stat-row"><span class="stat-label">Capacity</span><span class="stat-value">${club.cap?club.cap.toLocaleString():'—'}</span></div>
<div class="stat-row"><span class="stat-label">Colours</span><span class="stat-value">${club.colours||'—'}</span></div>
<div class="stat-row"><span class="stat-label">Nickname</span><span class="stat-value">${club.nick||'—'}</span></div>
</div>
<div class="card"><h3>Current Season</h3>
<div class="stat-row"><span class="stat-label">Division</span><span class="stat-value">${club.div}</span></div>
<div class="stat-row"><span class="stat-label">Manager</span><span class="stat-value">${club.mgr||'—'}</span></div>
<div class="stat-row"><span class="stat-label">Owners</span><span class="stat-value">${club.owners||'—'}</span></div>
<div class="stat-row"><span class="stat-label">Highest finish</span><span class="stat-value">${club.hi||'—'}</span></div>
<div class="stat-row"><span class="stat-label">Lowest finish</span><span class="stat-value">${club.lo||'—'}</span></div>
<div class="stat-row"><span class="stat-label">Rivals</span><span class="stat-value">${rivalsList||'—'}</span></div>
</div>
${honoursList?`<div class="card"><h3>Honours</h3><ul>${honoursList}</ul></div>`:''}
${legendsList?`<div class="card"><h3>Club Legends</h3><ul>${legendsList}</ul></div>`:''}
${historyList?`<div class="card card-full"><h3>Club History</h3><ul>${historyList}</ul></div>`:''}
</div></div>
<footer>The Pyramid · Club Guide · ${club.n}</footer>
</body></html>`;
}

function planStyles() {
  return `*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f0f2ef;color:#111;font-size:15px;line-height:1.5}
.hdr{background:linear-gradient(135deg,#0d2218 0%,#1B3A28 100%);border-bottom:4px solid #C9A84C;padding:20px 32px;display:flex;align-items:center;gap:20px;animation:fadeDown .4s ease}
.hdr-icon{font-size:36px;color:#C9A84C;line-height:1;flex-shrink:0}
.hdr-text h1{font-size:26px;font-weight:900;color:#C9A84C;text-transform:uppercase;letter-spacing:1.5px}
.hdr-text .sub{font-size:14px;color:rgba(255,255,255,0.6);margin-top:2px;font-weight:500}
.tab-nav{background:#fff;border-bottom:2px solid #e8e8e8;display:flex;padding:0 32px;overflow-x:auto}
.tab-link{display:inline-block;padding:13px 20px;font-size:13px;font-weight:700;color:#666;text-decoration:none;border-bottom:3px solid transparent;margin-bottom:-2px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;transition:color .2s,border-bottom-color .25s}
.tab-link:hover{color:#1B3A28;border-bottom-color:rgba(201,168,76,0.5)}
.tab-link.active{color:#1B3A28;border-bottom-color:#C9A84C}
.page{max-width:900px;margin:0 auto;padding:24px 24px 60px}
footer{text-align:center;color:#bbb;font-size:12px;padding:24px 0;border-top:2px solid #1B3A28;margin:0 32px}
@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`;
}

function planListPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Show Plans — EFL Pod</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
${planStyles()}
.toolbar{display:flex;justify-content:flex-end;margin-bottom:16px}
.btn-primary{background:#1B3A28;color:#fff;border:none;padding:11px 18px;border-radius:6px;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap}
.btn-primary:hover{background:#264d36}
.plan-list{display:flex;flex-direction:column;gap:10px}
.plan-card{background:#fff;border:1px solid #e8e8e8;border-radius:8px;padding:16px 18px;display:flex;align-items:center;gap:14px;text-decoration:none;color:#111;transition:box-shadow .2s,border-color .2s}
.plan-card:hover{box-shadow:0 4px 16px rgba(27,58,40,0.1);border-color:#1B3A28}
.plan-icon{font-size:22px;flex-shrink:0}
.plan-info{flex:1;min-width:0}
.plan-title{font-size:15px;font-weight:800;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.plan-meta{font-size:12px;color:#888;margin-top:2px}
.plan-del{border:none;background:none;color:#bbb;font-size:13px;font-weight:700;cursor:pointer;padding:6px 8px;flex-shrink:0}
.plan-del:hover{color:#c0392b}
.empty-msg{text-align:center;color:#999;padding:50px 20px;font-size:14px}
</style>
</head>
<body>
<div class="hdr">
  <div class="hdr-icon">📝</div>
  <div class="hdr-text"><h1>Show Plans</h1><div class="sub">Editable planning docs for each episode — share the link with anyone who needs it</div></div>
</div>
<nav class="tab-nav"><a href="/" class="tab-link">📋 Weekly Doc</a><a href="/clubs" class="tab-link">🏟️ Club Guide</a><a href="/transfers" class="tab-link">🔄 Transfers</a><a href="/clips" class="tab-link">🎬 Clips</a><a href="/plan" class="tab-link active">📝 Show Plan</a></nav>

<div class="page">
  <div class="toolbar"><button class="btn-primary" onclick="newPlan()">+ New Show Plan</button></div>
  <div class="plan-list" id="planList"></div>
  <div class="empty-msg" id="emptyMsg" style="display:none">No show plans yet — click "+ New Show Plan" to create the first one.</div>
</div>

<footer>Show Plans · EFL Pod</footer>

<script>
var TEMPLATE = '<h2>Episode Overview</h2>' +
  '<p><strong>Recording day:</strong> Monday &nbsp; <strong>Guests / callers:</strong> </p>' +
  '<p><strong>Big story of the week:</strong> </p>' +
  '<h2>Headlines &amp; Results Recap</h2>' +
  '<ul><li>Championship: </li></ul>' +
  '<h2>Recurring Segments (tick what is in this week)</h2>' +
  '<ul>' +
  '<li>&#9744; Predictions</li>' +
  '<li>&#9744; Best-ever EFL team debate</li>' +
  '<li>&#9744; Greatest EFL striker (Deeney vs Pukki vs Sharp etc.)</li>' +
  '<li>&#9744; EFL heroes (Vardy, Bowen, Eze...)</li>' +
  '<li>&#9744; History of a club</li>' +
  '<li>&#9744; Team of the Week</li>' +
  '<li>&#9744; Goal of the Week</li>' +
  '<li>&#9744; Ones to Watch</li>' +
  '<li>&#9744; Caller hot takes</li>' +
  '<li>&#9744; Best kits</li>' +
  '<li>&#9744; Best managers</li>' +
  '<li>&#9744; Best front 3</li>' +
  '</ul>';

function esc(s){
  return (s || '').toString().replace(/[&<>"']/g, function(c){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}
function timeAgo(iso){
  if (!iso) return '';
  var d = new Date(iso.replace(' ', 'T') + 'Z');
  var diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  return Math.floor(diff/86400) + 'd ago';
}

function loadPlans(){
  fetch('/api/plans').then(function(r){ return r.json(); }).then(function(data){
    var list = document.getElementById('planList');
    var empty = document.getElementById('emptyMsg');
    if (!data.length) { list.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    list.innerHTML = data.map(function(pl){
      return '<a class="plan-card" href="/plan/' + pl.id + '">' +
        '<div class="plan-icon">📄</div>' +
        '<div class="plan-info">' +
          '<div class="plan-title">' + esc(pl.title || 'Untitled Show Plan') + '</div>' +
          '<div class="plan-meta">' + (pl.episode_date ? esc(pl.episode_date) + ' · ' : '') + 'Updated ' + timeAgo(pl.updated_at) + '</div>' +
        '</div>' +
        '<button class="plan-del" onclick="event.preventDefault();delPlan(' + pl.id + ')">Delete</button>' +
      '</a>';
    }).join('');
  });
}

function newPlan(){
  fetch('/api/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Untitled Show Plan', episode_date: '', content: TEMPLATE })
  }).then(function(r){ return r.json(); }).then(function(data){
    location.href = '/plan/' + data.id;
  });
}

function delPlan(id){
  if (!confirm('Delete this show plan? This cannot be undone.')) return;
  fetch('/api/plans/' + id, { method: 'DELETE' }).then(function(){ loadPlans(); });
}

loadPlans();
</script>
</body>
</html>`;
}

function planEditorPage(id) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Show Plan — EFL Pod</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
${planStyles()}
.page{max-width:820px}
.doc-topbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.back-link{color:#1B3A28;text-decoration:none;font-size:13px;font-weight:700}
.back-link:hover{color:#C9A84C}
.doc-status{font-size:12px;color:#999;font-weight:600;flex:1}
.doc-actions{display:flex;gap:8px}
.doc-actions button{border:none;padding:9px 14px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap}
.btn-share{background:#C9A84C;color:#1B3A28}
.btn-share:hover{background:#dab766}
.btn-del{background:#f8d7da;color:#c0392b}
.btn-del:hover{background:#f3c1c6}
.doc-meta-row{display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap}
.doc-meta-row input[type=date]{padding:8px 10px;border-radius:6px;border:1px solid #ddd;font-family:inherit;font-size:13px}
.doc-meta-row label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#888}
.doc-toolbar{display:flex;gap:4px;background:#fff;border:1px solid #e8e8e8;border-radius:8px 8px 0 0;padding:8px 10px;position:sticky;top:0;z-index:10}
.doc-toolbar button{border:none;background:#f4f5f2;color:#333;width:32px;height:32px;border-radius:5px;font-weight:800;font-size:13px;cursor:pointer}
.doc-toolbar button:hover{background:#e8ebe4}
.doc-paper{background:#fff;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 10px 10px;box-shadow:0 4px 20px rgba(0,0,0,0.04)}
#titleInput{width:100%;border:none;outline:none;font-family:inherit;font-size:28px;font-weight:900;color:#111;padding:24px 28px 0;background:transparent}
#docBody{min-height:420px;padding:14px 28px 32px;outline:none;font-size:15px;line-height:1.7;color:#222}
#docBody h2{font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;color:#1B3A28;border-bottom:2px solid #C9A84C;padding-bottom:6px;margin:22px 0 10px}
#docBody h2:first-child{margin-top:0}
#docBody ul{padding-left:22px;margin-bottom:6px}
#docBody li{margin-bottom:5px}
#docBody p{margin-bottom:8px}
.copied-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1B3A28;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;opacity:0;pointer-events:none;transition:opacity .25s}
.copied-toast.show{opacity:1}
</style>
</head>
<body>
<div class="hdr">
  <div class="hdr-icon">📝</div>
  <div class="hdr-text"><h1>Show Plan</h1><div class="sub">Autosaves as you type — use Copy Export Link to send a clean read-only version to others</div></div>
</div>
<nav class="tab-nav"><a href="/" class="tab-link">📋 Weekly Doc</a><a href="/clubs" class="tab-link">🏟️ Club Guide</a><a href="/transfers" class="tab-link">🔄 Transfers</a><a href="/clips" class="tab-link">🎬 Clips</a><a href="/plan" class="tab-link active">📝 Show Plan</a></nav>

<div class="page">
  <div class="doc-topbar">
    <a class="back-link" href="/plan">&larr; All Show Plans</a>
    <div class="doc-status" id="docStatus"></div>
    <div class="doc-actions">
      <button class="btn-share" onclick="shareLink()">🔗 Copy Export Link</button>
      <button class="btn-del" onclick="deletePlan()">Delete</button>
    </div>
  </div>
  <div class="doc-meta-row">
    <label>Episode date</label>
    <input type="date" id="dateInput">
  </div>
  <div class="doc-toolbar">
    <button onclick="fmt('bold')" title="Bold"><b>B</b></button>
    <button onclick="fmt('italic')" title="Italic"><i>I</i></button>
    <button onclick="fmt('formatBlock','H2')" title="Heading">H2</button>
    <button onclick="fmt('insertUnorderedList')" title="Bullet list">&#8226;</button>
    <button onclick="fmt('insertOrderedList')" title="Numbered list">1.</button>
  </div>
  <div class="doc-paper">
    <input id="titleInput" type="text" placeholder="Untitled Show Plan">
    <div id="docBody" contenteditable="true"></div>
  </div>
</div>

<footer>Show Plan · EFL Pod</footer>
<div class="copied-toast" id="toast">Export link copied!</div>

<script>
var PLAN_ID = ${id};
var saveTimer = null;

function fmt(cmd, val){
  document.execCommand(cmd, false, val || null);
  document.getElementById('docBody').focus();
}

function setStatus(text){ document.getElementById('docStatus').textContent = text; }

function loadPlan(){
  fetch('/api/plans/' + PLAN_ID).then(function(r){ return r.json(); }).then(function(data){
    if (data.error) { setStatus('Plan not found'); return; }
    document.getElementById('titleInput').value = data.title || '';
    document.getElementById('dateInput').value = data.episode_date || '';
    document.getElementById('docBody').innerHTML = data.content || '';
    setStatus('All changes saved');
    document.title = (data.title || 'Show Plan') + ' — EFL Pod';
  });
}

function queueSave(){
  setStatus('Saving...');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(savePlan, 700);
}

function savePlan(){
  var body = {
    title: document.getElementById('titleInput').value || 'Untitled Show Plan',
    episode_date: document.getElementById('dateInput').value || '',
    content: document.getElementById('docBody').innerHTML
  };
  fetch('/api/plans/' + PLAN_ID, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(function(r){ return r.json(); }).then(function(){
    setStatus('All changes saved');
    document.title = (body.title || 'Show Plan') + ' — EFL Pod';
  });
}

function shareLink(){
  var url = location.origin + '/plan/' + PLAN_ID + '/export';
  var toast = document.getElementById('toast');
  function flash(){ toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); }, 1800); }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(flash);
  } else {
    var ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    flash();
  }
}

function deletePlan(){
  if (!confirm('Delete this show plan? This cannot be undone.')) return;
  fetch('/api/plans/' + PLAN_ID, { method: 'DELETE' }).then(function(){ location.href = '/plan'; });
}

document.getElementById('titleInput').addEventListener('input', queueSave);
document.getElementById('dateInput').addEventListener('change', queueSave);
document.getElementById('docBody').addEventListener('input', queueSave);
loadPlan();
</script>
</body>
</html>`;
}

function planExportPage(id) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Show Plan — EFL Pod</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f0f2ef;color:#111;font-size:15px;line-height:1.5}
.export-bar{display:flex;justify-content:space-between;align-items:center;max-width:760px;margin:0 auto;padding:20px 24px 0}
.export-bar .brand{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#1B3A28}
.export-bar button{border:none;background:#1B3A28;color:#fff;padding:9px 16px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer}
.export-bar button:hover{background:#264d36}
.page{max-width:760px;margin:0 auto;padding:16px 24px 60px}
.doc-paper{background:#fff;border:1px solid #e8e8e8;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.05);padding:36px 40px}
#exTitle{font-size:28px;font-weight:900;color:#111}
#exMeta{font-size:13px;color:#888;font-weight:700;margin-top:6px;padding-bottom:16px;border-bottom:2px solid #C9A84C;margin-bottom:16px}
#exBody{font-size:15px;line-height:1.7;color:#222}
#exBody h2{font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;color:#1B3A28;border-bottom:2px solid #C9A84C;padding-bottom:6px;margin:22px 0 10px}
#exBody h2:first-child{margin-top:0}
#exBody ul{padding-left:22px;margin-bottom:6px}
#exBody li{margin-bottom:5px}
#exBody p{margin-bottom:8px}
.export-footer{text-align:center;color:#bbb;font-size:12px;padding:10px 0 30px}
@media print{
  .export-bar{display:none}
  body{background:#fff}
  .doc-paper{box-shadow:none;border:none;padding:0}
  .export-footer{display:none}
}
</style>
</head>
<body>
<div class="export-bar">
  <div class="brand">📝 EFL Pod · Show Plan</div>
  <button onclick="window.print()">🖨️ Print / Save as PDF</button>
</div>
<div class="page">
  <div class="doc-paper">
    <div id="exTitle">Loading...</div>
    <div id="exMeta"></div>
    <div id="exBody"></div>
  </div>
</div>
<div class="export-footer">Exported from EFL Pod Show Plans</div>

<script>
var PLAN_ID = ${id};
fetch('/api/plans/' + PLAN_ID).then(function(r){ return r.json(); }).then(function(data){
  if (data.error) { document.getElementById('exTitle').textContent = 'Plan not found'; return; }
  var title = data.title || 'Untitled Show Plan';
  document.getElementById('exTitle').textContent = title;
  document.getElementById('exMeta').textContent = data.episode_date ? 'Episode date: ' + data.episode_date : '';
  document.getElementById('exBody').innerHTML = data.content || '';
  document.title = title + ' — EFL Pod';
});
</script>
</body>
</html>`;
}

const HOME = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Pyramid — 2 July 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f0f2ef;color:#111;font-size:17px;line-height:1.6}
a{color:#1B3A28;text-decoration:underline}

.hdr{background:linear-gradient(135deg,#0d2218 0%,#1B3A28 100%);border-bottom:4px solid #C9A84C;padding:20px 32px;display:flex;align-items:center;gap:20px;animation:fadeDown .4s ease}
.hdr-icon{font-size:36px;color:#C9A84C;line-height:1;flex-shrink:0}
.hdr-text h1{font-size:26px;font-weight:900;color:#C9A84C;text-transform:uppercase;letter-spacing:1.5px}
.hdr-text .sub{font-size:14px;color:rgba(255,255,255,0.6);margin-top:2px;font-weight:500;letter-spacing:0.3px}
.hdr-meta{margin-left:auto;text-align:right}
.hdr-meta .week-pill{background:#C9A84C;color:#1B3A28;font-size:12px;font-weight:900;letter-spacing:1px;text-transform:uppercase;padding:5px 14px;border-radius:3px}
.hdr-meta .date{font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px}

.page{max-width:900px;margin:0 auto;padding:0 0 60px}

.div-banner{background:linear-gradient(135deg,#0d2218 0%,#1B3A28 100%);color:#fff;padding:20px 32px;display:flex;align-items:center;justify-content:space-between;margin-top:32px}
.div-banner-title{font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:2px}
.div-banner-sub{font-size:13px;opacity:0.65;margin-top:3px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px}
.div-banner-pill{background:#C9A84C;color:#1B3A28;font-size:12px;font-weight:900;letter-spacing:1px;text-transform:uppercase;padding:6px 16px;border-radius:3px;white-space:nowrap}

.nat-banner{background:#2d3a33;color:#fff;padding:20px 32px;margin-top:32px;display:flex;align-items:center;gap:20px}
.nat-banner-title{font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:2px}
.nat-banner-sub{font-size:13px;opacity:0.65;margin-top:3px;text-transform:uppercase;letter-spacing:0.5px}
.nat-sub-banner{background:#3a4a3f;color:#fff;padding:14px 32px;display:flex;align-items:center;justify-content:space-between}
.nat-sub-banner-title{font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px}
.nat-sub-banner-pill{background:#C9A84C;color:#1B3A28;font-size:11px;font-weight:900;letter-spacing:0.5px;text-transform:uppercase;padding:4px 12px;border-radius:3px}

.div-section{background:#fff;padding:28px 32px;border-bottom:1px solid #e8e8e8}

.sub-hdr{font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1.2px;color:#1B3A28;border-bottom:2px solid #C9A84C;padding-bottom:8px;margin-bottom:16px;display:flex;align-items:center;gap:10px}
.sub-hdr.red{color:#1B3A28;border-bottom-color:#C9A84C}
.sub-hdr-badge{background:#C9A84C;color:#1B3A28;font-size:10px;font-weight:900;padding:2px 8px;border-radius:2px;letter-spacing:0.5px}
.sub-hdr.red .sub-hdr-badge{background:#C9A84C;color:#1B3A28}

/* CLUB BADGE */
.bge{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:22px;border-radius:3px;font-size:9px;font-weight:900;color:#fff;padding:0 5px;letter-spacing:0.4px;text-transform:uppercase;vertical-align:middle;margin-right:7px;flex-shrink:0}
.bge.dk{color:#111}

/* MATCH BLOCK */
.match-block{background:#F5F5F5;border-radius:6px;padding:18px 22px;margin-bottom:10px;border-left:5px solid #ccc;transition:transform .15s,box-shadow .15s}
.match-block:hover{transform:translateX(3px);box-shadow:0 4px 16px rgba(27,58,40,0.08)}
.match-block.done{border-left-color:#27ae60}
.match-block.tonight{border-left-color:#C8102E}
.match-teams{display:flex;align-items:center;margin-bottom:6px}
.team-name{flex:1;font-size:20px;font-weight:900;color:#111;display:flex;align-items:center}
.team-name.away{justify-content:flex-end}
.match-score{font-size:46px;font-weight:900;color:#1B3A28;padding:0 18px;white-space:nowrap;letter-spacing:-2px;flex-shrink:0}
.match-info{font-size:14px;color:#666;border-top:1px solid #ddd;padding-top:8px;margin-top:6px;line-height:1.5}
.match-info strong{color:#111}
.tag{display:inline-block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.4px;padding:2px 8px;border-radius:3px;margin-left:8px;white-space:nowrap;vertical-align:middle}
.tag-done{background:#d4edda;color:#155724}
.tag-tonight{background:#f8d7da;color:#C8102E}
.tag-soon{background:#e9ecef;color:#555}

/* TABLE */
.ltable{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:8px}
.ltable thead tr{background:#1B3A28;color:#fff}
.ltable th{padding:7px 10px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
.ltable th.c{text-align:center}
.ltable td{padding:7px 10px;border-bottom:1px solid #eee;vertical-align:middle}
.ltable .pos{font-weight:700;color:#999;text-align:center;width:32px}
.ltable .club{font-weight:700}
.ltable .pts{font-weight:800;color:#1B3A28;text-align:center;width:40px}
.ltable .note{font-size:12px;color:#777}
.ltable tr.up td{background:#e8f5e9}
.ltable tr.po td{background:#e3f2fd}
.ltable tr.dn td{background:#fce4ec}
.chip{display:inline-block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.3px;padding:1px 8px;border-radius:3px;white-space:nowrap}
.chip-up{background:#d4edda;color:#155724}
.chip-po{background:#dce9ff;color:#1a3799}
.chip-dn{background:#f8d7da;color:#721c24}
.chip-mid{background:#f0f0f0;color:#555}
.ltable-note{font-size:13px;color:#777;margin:6px 0 16px;font-style:italic}

/* STORY */
.story{border-left:4px solid #1B3A28;background:#f7f7f7;padding:15px 18px;margin-bottom:10px;border-radius:0 6px 6px 0;transition:box-shadow .2s,transform .15s}
.story:hover{box-shadow:0 4px 16px rgba(27,58,40,0.08);transform:translateX(2px)}
.story.red{border-left-color:#C9A84C}
.story h3{font-size:17px;font-weight:800;color:#111;margin-bottom:5px;display:flex;align-items:center;flex-wrap:wrap;gap:4px}
.story p{font-size:15px;color:#333;line-height:1.65;margin-bottom:5px}
.story p:last-of-type{margin-bottom:0}
.story .src{margin-top:7px;font-size:12px}
.story .src a{color:#999;margin-right:10px;text-decoration:underline}

/* ON AIR */
.on-air{border:2px solid #C9A84C;border-radius:6px;padding:16px 20px;margin-top:18px;background:rgba(201,168,76,0.04)}
.on-air-lbl{font-size:11px;font-weight:900;color:#C9A84C;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px}
.on-air ul{list-style:none;padding:0}
.on-air ul li{font-size:16px;color:#111;padding:5px 0 5px 22px;position:relative;line-height:1.5;border-bottom:1px solid #f2f2f2}
.on-air ul li:last-child{border-bottom:none;padding-bottom:0}
.on-air ul li::before{content:"→";position:absolute;left:0;color:#C9A84C;font-weight:800}

.sources-line{font-size:13px;color:#aaa;margin:6px 0 0}

footer{text-align:center;color:#bbb;font-size:12px;padding:24px 0;border-top:2px solid #1B3A28;margin:0 32px}

@media(max-width:600px){
  .hdr{flex-wrap:wrap;padding:16px}
  .hdr-meta{margin-left:0;margin-top:8px}
  .div-banner,.nat-banner,.nat-sub-banner{padding:14px 16px}
  .div-section{padding:18px 16px}
  .match-score{font-size:34px;padding:0 10px}
  .team-name{font-size:17px}
  .ltable .note{display:none}
}
.tab-nav{background:#fff;border-bottom:2px solid #e8e8e8;display:flex;padding:0 32px;overflow-x:auto}
.tab-link{display:inline-block;padding:13px 20px;font-size:13px;font-weight:700;color:#666;text-decoration:none;border-bottom:3px solid transparent;margin-bottom:-2px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;transition:color .2s,border-bottom-color .25s}
.tab-link:hover{color:#1B3A28;border-bottom-color:rgba(201,168,76,0.5)}
.tab-link.active{color:#1B3A28;border-bottom-color:#C9A84C}
.club-filter-bar{background:#fff;border-bottom:1px solid #e8e8e8;padding:12px 32px;display:flex;align-items:center;gap:10px}
.club-filter-bar label{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.6px;color:#1B3A28}
.club-filter-bar select{font-family:inherit;font-size:14px;font-weight:600;color:#111;background:#f5f5f5;border:1px solid #ddd;border-radius:5px;padding:7px 12px;cursor:pointer}
.club-filter-bar select:focus{outline:2px solid #C9A84C}
.club-filter-note{font-size:12px;color:#999;margin-left:auto}
@media(max-width:600px){.club-filter-bar{padding:10px 16px;flex-wrap:wrap}.club-filter-note{margin-left:0;width:100%}}
@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
</style>
</head>
<body>

<div class="hdr">
  <div class="hdr-icon">▲</div>
  <div class="hdr-text">
    <h1>The Pyramid</h1>
    <div class="sub">Tom Garratt &amp; Callum Fowler · EFL Football Weekly</div>
  </div>
  <div class="hdr-meta">
    <div class="week-pill">2 July 2026</div>
    <div class="date">Countdown to 2026/27</div>
  </div>
</div>
<nav class="tab-nav">
  <a href="/" class="tab-link active">📋 Weekly Doc</a>
  <a href="/clubs" class="tab-link">🏟️ Club Guide</a>
  <a href="/transfers" class="tab-link">🔄 Transfers</a>
  <a href="/clips" class="tab-link">🎬 Clips</a>
  <a href="/plan" class="tab-link">📝 Show Plan</a>
</nav>

<div class="club-filter-bar">
  <label for="clubFilter">Filter by club</label>
  <select id="clubFilter"><option value="">All Clubs</option></select>
  <span class="club-filter-note" id="clubFilterNote"></span>
</div>

<div class="page">

<!-- ═══════════════════════ CHAMPIONSHIP ═══════════════════════ -->
<div class="div-banner" style="margin-top:0">
  <div><div class="div-banner-title">Championship</div><div class="div-banner-sub">Summer News · Table · Fixtures</div></div>
  <div class="div-banner-pill">Ready for 2026/27</div>
</div>

<div class="div-section">
  <div class="sub-hdr red">Summer News <span class="sub-hdr-badge">Pre-Season</span></div>

  <div class="story red" data-clubs="Southampton, Middlesbrough, Hull City">
    <h3><span class="bge" style="background:#D71920">SOU</span>🔴 Spygate ends: Southampton disqualified, Hull City promoted instead</h3>
    <p>Southampton beat Middlesbrough in the semi-final but were <strong>expelled from the play-offs entirely</strong> after admitting a member of staff filmed Boro's training at Rockliffe Hall. Middlesbrough took their spot in the final — and lost 1–0 to Hull City at Wembley (McBurnie, 90+5', att. 84,506). Hull are promoted to the Premier League.</p>
    <p>Southampton also start 2026/27 on <strong>a 4-point deduction</strong> — meaning they need results just to reach zero before the season "really" begins.</p>
    <div class="src"><a href="https://en.wikipedia.org/wiki/2026_EFL_Championship_play-off_final" target="_blank">Wikipedia</a></div>
  </div>

  <div class="story" data-clubs="Wolverhampton Wanderers, Blackburn Rovers, Burnley, West Ham United">
    <h3>⬇️ Three Premier League clubs arrive: Wolves, Burnley &amp; West Ham</h3>
    <p>Wolves sacked Rob Edwards and appointed <strong>César Peixoto</strong>; they open at home to Blackburn (Fri 14 Aug) — Tony Mowbray's first game back in his second Rovers spell. Burnley are still managerless (Michael Jackson interim only) and open at Turf Moor against West Ham (Sun 16 Aug) — the two relegated sides colliding on matchday one. West Ham kept faith with Nuno Espírito Santo, tying him down to 2028.</p>
  </div>

  <div class="story" data-clubs="Sheffield Wednesday">
    <h3><span class="bge" style="background:#0066B2">SWE</span>💰 Sheffield Wednesday's £20m takeover — and the crest is coming back</h3>
    <p>The Storch family and Tom Costin completed a £20m takeover via Arise Capital Partners on 2 May, ending the Dejphon Chansiri era. The EFL waived a looming 15-point penalty that would otherwise have hit them in League One. Fans then voted ~96% in favour of reverting to the classic "stylised owl" crest last used in 2016 — ratified by the EFL for 2026/27.</p>
    <div class="src"><a href="https://www.skysports.com/football/news/11703/13539108/sheffield-wednesday-david-storch-and-arise-capital-partners-consortium-complete-takeover" target="_blank">Sky Sports</a></div>
  </div>

  <div class="story" data-clubs="Wolverhampton Wanderers, Blackburn Rovers, Burnley, West Ham United, Wrexham, Cardiff City, Sheffield United, Birmingham City">
    <h3>📅 Fixtures out, play-offs expanding to six teams</h3>
    <p>The 2026/27 fixture list was released 25 June — season starts 14–17 August. Standout openers: Wolves vs Blackburn (new managers on debut), Burnley vs West Ham at Turf Moor, Wrexham vs Cardiff City (first game back for Cardiff), Sheffield United vs Birmingham. Structural change to flag: the Championship play-offs expand from four to six qualifying teams from this season.</p>
  </div>

  <div class="story" data-clubs="Bristol City, Lincoln City, Watford, West Bromwich Albion">
    <h3>🔄 Manager merry-go-round</h3>
    <p>In, out, and one big surprise: <strong>Bristol City hired Michael Skubala</strong> — the man who just took Lincoln City up as League One champions — to replace the sacked Gerhard Struber. Watford appointed Italian Alessio Dionisi after sacking Ed Still inside three months. West Brom made James Morrison permanent after he steadied the ship post-Eric Ramsay. Lincoln, in turn, have promoted internally (Chris Cohen &amp; Tom Shaw) rather than replace Skubala with an outside appointment.</p>
  </div>

  <div class="story red" data-clubs="West Ham United, Tottenham Hotspur, Burnley">
    <h3>💰 Spurs beat Man Utd to Mateus Fernandes in club-record £85m deal</h3>
    <p>West Ham have agreed to sell 21-year-old midfielder <strong>Mateus Fernandes</strong> to Tottenham for around £85m — a Spurs club record — with the medical underway; Manchester United were also in the race. It's the biggest fee involving a Championship club so far this window. Burnley, meanwhile, have made their own statement signing: <strong>Florentino</strong> in from Benfica for £20.7m to sit in front of the defence.</p>
    <div class="src"><a href="https://www.skysports.com/football/news/11095/13559281" target="_blank">Sky Sports</a></div>
  </div>

  <div class="story" data-clubs="Wolverhampton Wanderers, Leicester City, Middlesbrough, Stoke City, Southampton, Derby County, Birmingham City">
    <h3>💼 Ins &amp; outs so far</h3>
    <p>Wolves have been busy — free-transfer swoops for <strong>Raúl Jiménez</strong> and <strong>Kieran Trippier</strong>, plus <strong>Ladislav Krejci</strong> in from Girona for £6.5m. Leicester's rebuild is mostly an exodus rather than a rebuild for now — around ten players are leaving as contracts expire, including <strong>Patson Daka</strong>, Jordan Ayew, Ricardo Pereira and Jamaal Lascelles (El Khannouss and Monga have already gone, to Stuttgart and Arsenal respectively). Middlesbrough look set to lose captain Hayden Hackney to Everton for around £25m. Elsewhere: Stoke paid £10m to Swansea for Ethan Galbraith, Southampton signed goalkeeper Daniel Peretz from Bayern (£6.9m) and Derby brought in Bobby Clark from RB Salzburg (£6m).</p>
    <div class="src"><a href="https://www.lcfc.com/news-transfers" target="_blank">LCFC</a> <a href="https://sportsmole.co.uk" target="_blank">Sports Mole</a></div>
  </div>

  <div class="on-air">
    <div class="on-air-lbl">On Air</div>
    <ul>
      <li>Southampton disqualified from their own play-off run — harsh, fair, or overdue? And can they even function on -4 points from day one?</li>
      <li>Bristol City poaching the manager who just won League One off a divisional rival — smart business or bad look?</li>
      <li>Sheffield Wednesday's takeover + crest reversal — best off-season story in the whole pyramid?</li>
      <li>Burnley still without a permanent manager weeks out from facing West Ham on opening day — a problem?</li>
      <li>Six-team play-offs from this season — does it dilute the drama or just give more clubs a shot?</li>
    </ul>
  </div>
</div>

<div class="div-section">
  <div class="sub-hdr">Final Table</div>
  <table class="ltable">
    <thead><tr><th class="c">Pos</th><th>Club</th><th class="c">Pts</th><th>Status</th><th>Note</th></tr></thead>
    <tbody>
      <tr class="up"><td class="pos">1</td><td class="club"><span class="bge" style="background:#0056A2">COV</span>Coventry City</td><td class="pts">95</td><td><span class="chip chip-up">Champions</span></td><td class="note">Frank Lampard — 25-year wait</td></tr>
      <tr class="up"><td class="pos">2</td><td class="club"><span class="bge" style="background:#0044A0">IPS</span>Ipswich Town</td><td class="pts">84</td><td><span class="chip chip-up">Promoted</span></td><td class="note">Back after one PL season</td></tr>
      <tr class="po"><td class="pos">3</td><td class="club"><span class="bge" style="background:#001489">MIL</span>Millwall</td><td class="pts">83</td><td><span class="chip chip-po">Play-offs</span></td><td class="note">Eyeing first-ever PL promotion</td></tr>
      <tr class="po"><td class="pos">4</td><td class="club"><span class="bge" style="background:#D71920">SOU</span>Southampton ⚡</td><td class="pts">80</td><td><span class="chip chip-po">Play-offs</span></td><td class="note">20-game unbeaten run</td></tr>
      <tr class="po"><td class="pos">5</td><td class="club"><span class="bge" style="background:#CC0000">MID</span>Middlesbrough</td><td class="pts">80</td><td><span class="chip chip-po">Play-offs</span></td><td class="note">Spygate victims</td></tr>
      <tr class="po"><td class="pos">6</td><td class="club"><span class="bge" style="background:#F5A12D" class="dk">HUL</span>Hull City</td><td class="pts">73</td><td><span class="chip chip-po">Play-offs</span></td><td class="note">Final-day comeback vs Norwich</td></tr>
      <tr><td class="pos">7</td><td class="club"><span class="bge" style="background:#CC0000">WRX</span>Wrexham</td><td class="pts">71</td><td></td><td class="note">Final-day heartbreak</td></tr>
      <tr><td class="pos">8</td><td class="club"><span class="bge" style="background:#1C1C1C">DER</span>Derby County</td><td class="pts">69</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">9</td><td class="club"><span class="bge" style="background:#00A650">NOR</span>Norwich City</td><td class="pts">65</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">10</td><td class="club"><span class="bge" style="background:#2463AE">BIR</span>Birmingham City</td><td class="pts">64</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">11</td><td class="club"><span class="bge" style="background:#1C1C1C">SWA</span>Swansea City</td><td class="pts">64</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">12</td><td class="club"><span class="bge" style="background:#CC0000">BCY</span>Bristol City</td><td class="pts">62</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">13</td><td class="club"><span class="bge" style="background:#CC0000">SHU</span>Sheffield United</td><td class="pts">60</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">14</td><td class="club"><span class="bge" style="background:#1B3A7A">PNE</span>Preston North End</td><td class="pts">60</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">15</td><td class="club"><span class="bge" style="background:#1B5CB5">QPR</span>Queens Park Rangers</td><td class="pts">58</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">16</td><td class="club"><span class="bge" style="background:#FBEE23;color:#111">WAT</span>Watford</td><td class="pts">57</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">17</td><td class="club"><span class="bge" style="background:#CC0000">STK</span>Stoke City</td><td class="pts">55</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">18</td><td class="club"><span class="bge" style="background:#001489">POM</span>Portsmouth</td><td class="pts">55</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">19</td><td class="club"><span class="bge" style="background:#CC0000">CHA</span>Charlton Athletic</td><td class="pts">53</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">20</td><td class="club"><span class="bge" style="background:#009EE2">BBR</span>Blackburn Rovers</td><td class="pts">52</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">21</td><td class="club"><span class="bge" style="background:#003087">WBA</span>West Brom</td><td class="pts">51</td><td><span class="chip chip-mid">Stayed up</span></td><td class="note">−2pts PSR (Apr 2026)</td></tr>
      <tr class="dn"><td class="pos">22</td><td class="club"><span class="bge" style="background:#F8BC00;color:#111">OXF</span>Oxford United</td><td class="pts">47</td><td><span class="chip chip-dn">Relegated</span></td><td class="note">To League One</td></tr>
      <tr class="dn"><td class="pos">23</td><td class="club"><span class="bge" style="background:#003090">LEI</span>Leicester City</td><td class="pts">46</td><td><span class="chip chip-dn">Relegated</span></td><td class="note">−6pts PSR · To League One</td></tr>
      <tr class="dn"><td class="pos">24</td><td class="club"><span class="bge" style="background:#0066B2">SWE</span>Sheffield Wednesday</td><td class="pts">—</td><td><span class="chip chip-dn">Relegated</span></td><td class="note">−18pts · Record-time relegation</td></tr>
    </tbody>
  </table>
  <div class="ltable-note">Arriving next season: Wolverhampton Wanderers, Burnley &amp; West Ham United (relegated from Premier League)</div>
</div>


<!-- ═══════════════════════ LEAGUE ONE ═══════════════════════ -->
<div class="div-banner">
  <div><div class="div-banner-title">League One</div><div class="div-banner-sub">Summer News · Table · Fixtures</div></div>
  <div class="div-banner-pill">Ready for 2026/27</div>
</div>

<div class="div-section">
  <div class="sub-hdr red">Summer News <span class="sub-hdr-badge">Pre-Season</span></div>

  <div class="story" data-clubs="Bolton Wanderers, Stockport County">
    <h3><span class="bge" style="background:#1C3A8A">BOL</span>🏆 Bolton Wanderers 4-1 Stockport County — Trotters back in the Championship</h3>
    <p>Wembley, 24 May, att. 48,268. Rúben Rodrigues scored twice (3', a stoppage-time penalty) either side of a Kyle Wootton own goal and a Sam Dalby strike; Adama Sidibeh's reply came too late. Stockport's Josh Dacres-Cogley was sent off before the late penalty. Bolton return to the second tier after seven years away.</p>
    <div class="src"><a href="https://www.bwfc.co.uk/news/play-final-report-wanderers-4-stockport-county-1" target="_blank">Bolton Wanderers</a></div>
  </div>

  <div class="story red" data-clubs="Sheffield Wednesday, Swansea City, Aston Villa">
    <h3><span class="bge" style="background:#0066B2">SWE</span>💰 Sheffield Wednesday land in League One with a new owner and a new (old) crest</h3>
    <p>Fresh off a £20m takeover and an EFL-ratified return to the classic "stylised owl" badge, Wednesday arrive as one of the biggest scalps this division has ever had. On the pitch: Ricardo Santos in from Swansea, Callum Slattery and Jordi Liongola added, Sil Swinkels close to a permanent move from Aston Villa. Their first home game of the new era is a Yorkshire derby.</p>
  </div>

  <div class="story red" data-clubs="Leicester City">
    <h3><span class="bge" style="background:#003090">LEI</span>🦊 Leicester in League One for only the 2nd time in 142 years — Russell Martin in, exodus under way</h3>
    <p>Ten years on from the 5,000-1 title, back-to-back relegations (plus a 6-point PSR deduction) have sent Leicester into the third tier. Russell Martin has been appointed on a three-year deal — their seventh permanent boss since April 2023 — replacing caretaker Gary Rowett. On the pitch it's almost entirely outgoings so far: around ten players leaving as contracts expire, including Patson Daka, Jordan Ayew, Ricardo Pereira and Jamaal Lascelles, plus Wout Faes confirmed departing and Harry Winks (Cagliari) and Victor Kristiansen (Panathinaikos) both in exit talks. Leicester open the season away at Notts County (Sat 15 Aug, 12:30pm, live on Sky) in an East Midlands derby.</p>
    <div class="src"><a href="https://www.lcfc.com/media-article/chairman-statement-leicester-city-relegated-league-one" target="_blank">LCFC</a></div>
  </div>

  <div class="story" data-clubs="Blackpool, Luton Town, Barnsley, Huddersfield Town, Exeter City, Wigan Athletic, Stockport County, Lincoln City, Bristol City">
    <h3>🔄 Manager merry-go-round</h3>
    <p>Blackpool appointed <strong>Steve Bruce</strong>; Luton Town brought back boyhood fan <strong>Jack Wilshere</strong> to manage his old club and moved their pre-season camp to Spain; Barnsley re-appointed <strong>Daniel Stendel</strong> for a second Oakwell spell; Huddersfield hired <strong>Martin Drury</strong> — their 10th permanent or de-facto boss since 2022; Exeter made <strong>Matt Taylor</strong> permanent after Gary Caldwell left for Wigan (2nd spell); Stockport lost Dave Challinor and turned to ex-Rochdale promotion-winner <strong>Jimmy McNulty</strong>; and Lincoln City, having lost title-winner Michael Skubala to Bristol City, are running with internal duo <strong>Chris Cohen &amp; Tom Shaw</strong>.</p>
  </div>

  <div class="story" data-clubs="Oxford United, West Bromwich Albion">
    <h3>💼 Oxford turn to Aaron Ramsey after Bloomfield exit</h3>
    <p>Oxford sacked Matt Bloomfield following relegation (22nd, four points from safety) and have appointed Aaron Ramsey — the 35-year-old ex-Arsenal and Wales midfielder, who retired earlier this year and had a caretaker spell at Cardiff — as head coach, his first permanent job. On transfers: Matt Ingram has joined West Brom and Przemysław Płacheta's off to Austin FC in MLS; Oxford are chasing free agent Bamba Dieng (also wanted by Blackburn, Leicester, Portsmouth and St Pauli) but haven't landed a confirmed first-team signing yet.</p>
    <div class="src"><a href="https://www.skysports.com/football/news/12040/13556847/oxford-united-aaron-ramsey-appointed-head-coach-after-matt-bloomfield-exit" target="_blank">Sky Sports</a></div>
  </div>

  <div class="story" data-clubs="Leyton Orient, Bristol City">
    <h3>🎯 Bristol City bid for League One's top scorer</h3>
    <p>Bristol City have tabled a bid for Leyton Orient's Dom Ballard, who scored 23 goals last season to finish as League One's top scorer — Orient are said to want the offer improved before it goes through.</p>
  </div>

  <div class="on-air">
    <div class="on-air-lbl">On Air</div>
    <ul>
      <li>Sheffield Wednesday arrive with a new owner, a new crest and a point to prove — favourites for an instant return?</li>
      <li>Jack Wilshere managing his boyhood club — best storyline in the division this summer?</li>
      <li>Bristol City poaching Lincoln's title-winning manager, then Lincoln poaching nobody and just promoting from within — who got the better end of that?</li>
      <li>Leicester City's rebuild so far is mostly outgoings — how worried should Foxes fans be?</li>
      <li>Stockport handing the reins to the man who just got Rochdale out of the National League — good appointment?</li>
    </ul>
  </div>
</div>

<div class="div-section">
  <div class="sub-hdr">Final Table</div>
  <table class="ltable">
    <thead><tr><th class="c">Pos</th><th>Club</th><th class="c">Pts</th><th>Status</th><th>Note</th></tr></thead>
    <tbody>
      <tr class="up"><td class="pos">1</td><td class="club"><span class="bge" style="background:#CC0000">LIN</span>Lincoln City</td><td class="pts">103</td><td><span class="chip chip-up">Champions</span></td><td class="note">Championship — first since 1961!</td></tr>
      <tr class="up"><td class="pos">2</td><td class="club"><span class="bge" style="background:#0070B5">CAR</span>Cardiff City</td><td class="pts">91</td><td><span class="chip chip-up">Promoted</span></td><td class="note">Bounced straight back</td></tr>
      <tr class="po"><td class="pos">3</td><td class="club"><span class="bge" style="background:#0044A0">SKC</span>Stockport County</td><td class="pts">77</td><td><span class="chip chip-po">Play-offs</span></td><td class="note"></td></tr>
      <tr class="po"><td class="pos">4</td><td class="club"><span class="bge" style="background:#6C1D45">BRA</span>Bradford City</td><td class="pts">77</td><td><span class="chip chip-po">Play-offs</span></td><td class="note">Valley Parade — Thu 14 May</td></tr>
      <tr class="po"><td class="pos">5</td><td class="club"><span class="bge" style="background:#1C3A8A">BOL</span>Bolton Wanderers</td><td class="pts">75</td><td><span class="chip chip-po">Play-offs</span></td><td class="note"></td></tr>
      <tr class="po"><td class="pos">6</td><td class="club"><span class="bge" style="background:#CC0000">STG</span>Stevenage</td><td class="pts">75</td><td><span class="chip chip-po">Play-offs</span></td><td class="note"></td></tr>
      <tr><td class="pos">7</td><td class="club"><span class="bge" style="background:#F87521">LUT</span>Luton Town</td><td class="pts">74</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">8</td><td class="club"><span class="bge" style="background:#007B3C">PLY</span>Plymouth Argyle</td><td class="pts">73</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">9</td><td class="club"><span class="bge" style="background:#0066B2">HUD</span>Huddersfield Town</td><td class="pts">67</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">10</td><td class="club"><span class="bge" style="background:#F8BC00;color:#111">MFD</span>Mansfield Town</td><td class="pts">65</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">11</td><td class="club"><span class="bge" style="background:#1C2D67">WYC</span>Wycombe Wanderers</td><td class="pts">63</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">12</td><td class="club"><span class="bge" style="background:#004494">REA</span>Reading</td><td class="pts">63</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">13</td><td class="club"><span class="bge" style="background:#F68712">BPL</span>Blackpool</td><td class="pts">60</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">14</td><td class="club"><span class="bge" style="background:#CC0000">DON</span>Doncaster Rovers</td><td class="pts">60</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">15</td><td class="club"><span class="bge" style="background:#CC0000">BAR</span>Barnsley</td><td class="pts">59</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">16</td><td class="club"><span class="bge" style="background:#1C5AB7">WIG</span>Wigan Athletic</td><td class="pts">56</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">17</td><td class="club"><span class="bge" style="background:#F8BC00;color:#111">BUR</span>Burton Albion</td><td class="pts">54</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">18</td><td class="club"><span class="bge" style="background:#0044A0">PBO</span>Peterborough United</td><td class="pts">53</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">19</td><td class="club"><span class="bge" style="background:#0044A0">WIM</span>AFC Wimbledon</td><td class="pts">53</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">20</td><td class="club"><span class="bge" style="background:#CC0000">LEY</span>Leyton Orient</td><td class="pts">52</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">21</td><td class="club"><span class="bge" style="background:#CC0000">EXE</span>Exeter City</td><td class="pts">49</td><td></td><td class="note"></td></tr>
      <tr class="dn"><td class="pos">22</td><td class="club"><span class="bge" style="background:#1C1C1C">PVA</span>Port Vale</td><td class="pts">42</td><td><span class="chip chip-dn">Relegated</span></td><td class="note">To League Two</td></tr>
      <tr class="dn"><td class="pos">23</td><td class="club"><span class="bge" style="background:#CC0000">ROT</span>Rotherham United</td><td class="pts">41</td><td><span class="chip chip-dn">Relegated</span></td><td class="note">To League Two</td></tr>
      <tr class="dn"><td class="pos">24</td><td class="club"><span class="bge" style="background:#A50026">NTN</span>Northampton Town</td><td class="pts">35</td><td><span class="chip chip-dn">Relegated</span></td><td class="note">9 wins all season</td></tr>
    </tbody>
  </table>
  <div class="ltable-note">Arriving next season: Leicester City, Sheffield Wednesday, Oxford United (relegated from Championship)</div>
</div>


<!-- ═══════════════════════ LEAGUE TWO ═══════════════════════ -->
<div class="div-banner">
  <div><div class="div-banner-title">League Two</div><div class="div-banner-sub">Summer News · Table · Fixtures</div></div>
  <div class="div-banner-pill">Ready for 2026/27</div>
</div>

<div class="div-section">
  <div class="sub-hdr red">Summer News <span class="sub-hdr-badge">Pre-Season</span></div>

  <div class="story" data-clubs="Notts County, Salford City">
    <h3><span class="bge" style="background:#1C1C1C">NTM</span>🏆 Notts County 3-0 Salford City — world's oldest club up to League One</h3>
    <p>Wembley, Monday 25 May, att. 30,851. Alassana Jatta, Lucas Ness and Jodi Jones scored for Notts County, who beat Salford's co-owner David Beckham to a promotion party in front of him in the stands. Salford have since moved on: from 1 July they've reverted to a circular black-and-orange crest and orange home kit (77.1% of fans backed the change in a vote), and appointed <strong>Peter Cklamovski</strong> — formerly Ange Postecoglou's assistant, most recently Malaysia national team boss — as their new head coach.</p>
    <div class="src"><a href="https://www.efl.com/news/2026/may/25/live--sky-bet-league-two-play-off-final-notts-county-v-salford-city/" target="_blank">EFL.com</a> <a href="https://www.footballleagueworld.co.uk/salford-city-confirm-big-change-after-stoke-city-middlesbrough-decisions" target="_blank">FLW</a></div>
  </div>

  <div class="story" data-clubs="Newport County">
    <h3>😬 Newport boss quits on the eve of pre-season</h3>
    <p>Christian Fuchs has resigned as Newport County manager after just seven months — barely eight weeks after keeping the club up on the final day. Newport are now searching for their fourth boss in a little over two years, with no replacement named as of 2 July.</p>
  </div>

  <div class="story" data-clubs="Northampton Town, Rotherham United, Walsall, Salford City">
    <h3>🔄 Manager merry-go-round</h3>
    <p>Northampton Town appointed <strong>Chris Hogg</strong>; Rotherham United (relegated from League One) turned to <strong>Alex Bruce</strong> after failed approaches for Ian Burchnall and Mat Sadler; Walsall hired ex-Man Utd keeper <strong>Lee Grant</strong> after sacking Sadler in March. Salford's vacancy (above) remains the big one still unresolved.</p>
  </div>

  <div class="story" data-clubs="Rochdale, Stockport County">
    <h3>👋 Rochdale back in the EFL — but lose their promotion-winning boss</h3>
    <p>Rochdale beat Boreham Wood on penalties to return to the Football League, then immediately lost manager Jimmy McNulty to League One's Stockport County. They've replaced him with Ian Watson, arriving from National League North side South Shields.</p>
  </div>

  <div class="story" data-clubs="Grimsby Town, Fleetwood Town">
    <h3>👕 Kit news: Grimsby switch manufacturer, Fleetwood go retro</h3>
    <p>Grimsby Town have signed a new multi-year kit deal with Italian brand Lotto, ending their relationship with Umbro. Fleetwood Town's new Puma home kit brings back a retro badge and darker red.</p>
  </div>

  <div class="on-air">
    <div class="on-air-lbl">On Air</div>
    <ul>
      <li>Salford's full rebrand plus a Postecoglou-lineage head coach in Cklamovski — genuine promotion push or just a fresh coat of paint?</li>
      <li>Notts County — world's oldest professional club — now in League One. Where do they end up in 5 years?</li>
      <li>Rochdale get promoted then immediately lose their manager to a divisional rival two tiers up — gutted or just football?</li>
      <li>Newport's manager quitting on the eve of pre-season, two months after saving them from relegation — what's actually going on there?</li>
      <li>Which of this summer's new managers (Hogg, Bruce, Grant) is under the most pressure from day one?</li>
    </ul>
  </div>
</div>

<div class="div-section">
  <div class="sub-hdr">Final Table</div>
  <table class="ltable">
    <thead><tr><th class="c">Pos</th><th>Club</th><th class="c">Pts</th><th>Status</th><th>Note</th></tr></thead>
    <tbody>
      <tr class="up"><td class="pos">1</td><td class="club"><span class="bge" style="background:#CC0000">BRO</span>Bromley FC</td><td class="pts">87</td><td><span class="chip chip-up">Champions</span></td><td class="note">First time in L1 in 134 years!</td></tr>
      <tr class="up"><td class="pos">2</td><td class="club"><span class="bge" style="background:#CC0000">MKD</span>MK Dons</td><td class="pts">86</td><td><span class="chip chip-up">Promoted</span></td><td class="note">3–0 vs Tranmere to clinch</td></tr>
      <tr class="up"><td class="pos">3</td><td class="club"><span class="bge" style="background:#F8BC00;color:#111">CAM</span>Cambridge United</td><td class="pts">82</td><td><span class="chip chip-up">Promoted</span></td><td class="note">Straight back after one season</td></tr>
      <tr class="po"><td class="pos">4</td><td class="club"><span class="bge" style="background:#CC0000">SAL</span>Salford City</td><td class="pts">81</td><td><span class="chip chip-po">Play-offs</span></td><td class="note">Karl Robinson · Famous owners</td></tr>
      <tr class="po"><td class="pos">5</td><td class="club"><span class="bge" style="background:#1C1C1C">NTM</span>Notts County</td><td class="pts">80</td><td><span class="chip chip-po">Play-offs</span></td><td class="note">World's oldest professional club</td></tr>
      <tr class="po"><td class="pos">6</td><td class="club"><span class="bge" style="background:#2463AE">CHE</span>Chesterfield</td><td class="pts">79</td><td><span class="chip chip-po">Play-offs</span></td><td class="note"></td></tr>
      <tr class="po"><td class="pos">7</td><td class="club"><span class="bge" style="background:#1C1C1C">GRI</span>Grimsby Town</td><td class="pts">78</td><td><span class="chip chip-po">Play-offs</span></td><td class="note">Scored after 26 secs — then lost</td></tr>
      <tr><td class="pos">8</td><td class="club"><span class="bge" style="background:#F8BC00;color:#111">BNT</span>Barnet</td><td class="pts">76</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">9</td><td class="club"><span class="bge" style="background:#CC0000">SWI</span>Swindon Town</td><td class="pts">75</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">10</td><td class="club"><span class="bge" style="background:#0044A0">OLD</span>Oldham Athletic</td><td class="pts">68</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">11</td><td class="club"><span class="bge" style="background:#CC0000">CRE</span>Crewe Alexandra</td><td class="pts">67</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">12</td><td class="club"><span class="bge" style="background:#0044A0">COL</span>Colchester United</td><td class="pts">66</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">13</td><td class="club"><span class="bge" style="background:#CC0000">WAL</span>Walsall</td><td class="pts">65</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">14</td><td class="club"><span class="bge" style="background:#003087">BRV</span>Bristol Rovers</td><td class="pts">62</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">15</td><td class="club"><span class="bge" style="background:#CC0000">FLT</span>Fleetwood Town</td><td class="pts">61</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">16</td><td class="club"><span class="bge" style="background:#CC0000">ACC</span>Accrington Stanley</td><td class="pts">53</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">17</td><td class="club"><span class="bge" style="background:#003087">GIL</span>Gillingham</td><td class="pts">53</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">18</td><td class="club"><span class="bge" style="background:#CC0000">CHT</span>Cheltenham Town</td><td class="pts">52</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">19</td><td class="club"><span class="bge" style="background:#0044A0">SHR</span>Shrewsbury Town</td><td class="pts">49</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">20</td><td class="club"><span class="bge" style="background:#F8BC00;color:#111">NPT</span>Newport County</td><td class="pts">43</td><td></td><td class="note"></td></tr>
      <tr><td class="pos">21</td><td class="club"><span class="bge" style="background:#0044A0">TRN</span>Tranmere Rovers</td><td class="pts">41</td><td></td><td class="note"></td></tr>
      <tr class="dn"><td class="pos">22</td><td class="club"><span class="bge" style="background:#CC0000">CRW</span>Crawley Town</td><td class="pts">40</td><td><span class="chip chip-dn">Relegated</span></td><td class="note">To National League</td></tr>
      <tr class="dn"><td class="pos">23</td><td class="club"><span class="bge" style="background:#F8BC00;color:#111">HGT</span>Harrogate Town</td><td class="pts">39</td><td><span class="chip chip-dn">Relegated</span></td><td class="note">Ended 6-season EFL stay</td></tr>
      <tr class="dn"><td class="pos">24</td><td class="club"><span class="bge" style="background:#CC0000">BRW</span>Barrow</td><td class="pts">36</td><td><span class="chip chip-dn">Relegated</span></td><td class="note">Newport sent them down</td></tr>
    </tbody>
  </table>
</div>


<!-- ═══════════════════════ NATIONAL LEAGUE ═══════════════════════ -->
<div class="nat-banner">
  <div><div class="nat-banner-title">National League</div><div class="nat-banner-sub">Summer news ahead of 2026/27</div></div>
</div>

<div class="div-section">
  <div class="story">
    <h3>📅 Fixtures out 10 July — season starts 8 August</h3>
    <p>National League, NL North and NL South fixtures all drop together on Friday 10 July at 11am — still a week away as we go to print. Play-offs run 28 April–2 May 2027, with the Promotion Final back at Wembley on 9 May.</p>
  </div>
  <div class="story" data-clubs="Carlisle United, Gateshead, Southend United, Kidderminster Harriers, Barrow">
    <h3>🔄 Manager merry-go-round: three first-time bosses appointed</h3>
    <p>Carlisle United — bookies' early favourites for the title at 11/4 — appointed ex-Newcastle keeper <strong>Rob Elliot</strong>. Gateshead gave <strong>Lee Cattermole</strong> his first senior job. Southend United did the same for <strong>Kieron Dyer</strong>. Meanwhile Kidderminster Harriers lost promotion-winning boss Adam Murray to Barrow just days after going up, and replaced him with ex-Torquay manager <strong>Paul Wotton</strong>.</p>
  </div>
  <div class="story" data-clubs="Hornchurch">
    <h3>🎙️ Anton Ferdinand takes his first coaching role — at Hornchurch</h3>
    <p>The former West Ham and QPR defender has joined newly-promoted Hornchurch as first-team coach, reuniting with old team-mate and manager Daryl McMahon.</p>
    <div class="src"><a href="https://fanbanter.co.uk/anton-ferdinand-speaks-on-taking-first-coaching-role-with-national-league-new-boys/" target="_blank">Fan Banter</a></div>
  </div>
  <div class="story">
    <h3>📣 "3UP" campaign still unresolved</h3>
    <p>All 72 National League clubs back the campaign for three automatic EFL promotion spots instead of one, and it's picked up cross-party MP support and an FSA fan poll showing 9 in 10 in favour. The EFL has agreed to put it to its member clubs — but no vote date or result yet. Genuine live story to keep tracking into the season.</p>
  </div>
  <div class="story" data-clubs="Portishead Town, Willand Rovers">
    <h3>🚧 Portishead denied promotion over ground grading</h3>
    <p>Portishead Town won the Southern League Division One South play-offs but were denied a step up the pyramid after failing ground grading requirements — Willand Rovers took the reprieved spot instead.</p>
  </div>
  <div class="on-air">
    <div class="on-air-lbl">On Air</div>
    <ul>
      <li>Should the National League get three automatic promotion spots like every other division in the pyramid?</li>
      <li>Anton Ferdinand's first coaching job coming at Hornchurch, of all places — good starting point for a coaching career?</li>
      <li>Carlisle as early title favourites under a rookie manager (Rob Elliot) — deserved, or lazy bookmaking?</li>
      <li>A club winning promotion on the pitch and still not going up because of ground grading — how harsh is that on Portishead?</li>
    </ul>
  </div>
</div>

<div class="nat-sub-banner">
  <div class="nat-sub-banner-title">National League North &amp; South</div>
  <div class="nat-sub-banner-pill">Summer news</div>
</div>

<div class="div-section">
  <div class="story" data-clubs="AFC Fylde, Kidderminster Harriers, Worthing, Hornchurch">
    <h3>🏆 The four promoted sides settling in</h3>
    <p><span class="bge" style="background:#6b7280">FYL</span><strong>AFC Fylde</strong> (NL North champions) have signed striker Cedric Main from Darlington, described as the first of "several marquee signings planned." <strong>Kidderminster Harriers</strong> (NL North play-off winners) retained key men Olly Tipton and academy graduate Samson, but lost Joe Foulkes to Grimsby Town and manager Adam Murray to Barrow (see above). <strong>Worthing</strong> (NL South champions) have made four signings including ex-Watford academy winger Dom Hutchinson. <strong>Hornchurch</strong> (NL South play-off winners) have signed midfielder Nathan Ferguson from Hartlepool, plus the Anton Ferdinand coaching appointment above.</p>
  </div>
  <div class="story" data-clubs="Alfreton Town, Curzon Ashton, Bath City, Chippenham, Enfield Town, Eastbourne Borough">
    <h3>📉 Relegated sides regrouping</h3>
    <p>Alfreton Town, Curzon Ashton (NL North) and Bath City, Chippenham, Enfield Town, Eastbourne Borough (NL South) all dropped out of their respective divisions at the end of last season and are now rebuilding a tier down.</p>
  </div>
  <div class="on-air">
    <div class="on-air-lbl">On Air (if big enough)</div>
    <ul>
      <li>Four different clubs promoted into the National League this summer — who's best set up to survive?</li>
    </ul>
  </div>
</div>

</div>

<footer>The Pyramid &nbsp;·&nbsp; EFL Football Weekly &nbsp;·&nbsp; 2 July 2026</footer>

<script>
(function(){
  var select = document.getElementById('clubFilter');
  var note = document.getElementById('clubFilterNote');
  var stories = Array.prototype.slice.call(document.querySelectorAll('.story[data-clubs]'));
  var clubs = [];
  stories.forEach(function(s){
    s.getAttribute('data-clubs').split(',').forEach(function(c){
      c = c.trim();
      if (c && clubs.indexOf(c) === -1) clubs.push(c);
    });
  });
  clubs.sort();
  clubs.forEach(function(c){
    var opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });

  var newsSections = Array.prototype.slice.call(document.querySelectorAll('.div-section')).filter(function(sec){
    return sec.querySelector('.story') !== null;
  });

  function applyFilter(){
    var val = select.value;
    var visibleCount = 0;
    stories.forEach(function(s){
      var list = (s.getAttribute('data-clubs') || '').split(',').map(function(c){ return c.trim(); });
      var show = !val || list.indexOf(val) !== -1;
      s.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });
    newsSections.forEach(function(sec){
      if (!val) { sec.style.display = ''; return; }
      var anyVisible = Array.prototype.slice.call(sec.querySelectorAll('.story')).some(function(s){
        return s.style.display !== 'none';
      });
      sec.style.display = anyVisible ? '' : 'none';
    });
    note.textContent = val ? (visibleCount + ' stor' + (visibleCount === 1 ? 'y' : 'ies') + ' about ' + val) : '';
  }

  select.addEventListener('change', applyFilter);
})();
</script>

</body>
</html>`;
