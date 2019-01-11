import "@babel/polyfill";

console.log('splatfests-viewer');

const API_BASE = 'https://splatoon2.ink';
const IMAGE_BASE = `${API_BASE}/assets/splatnet`

function festivalRankingAPIURL(region, festival_id) {
  return `${API_BASE}/data/festivals/${region}-${festival_id}-rankings.json`;
}

function fetchFestivals() {
  return fetch(API_BASE + '/data/festivals.json').then(resp => {
    return resp.json();
  });
}

// e.g. https://splatoon2.ink/data/festivals/jp-4055-rankings.json
function fetchFestivalRanking(region, festival_id) {
  return fetch(festivalRankingAPIURL(region, festival_id)).then(resp => {
    return resp.json();
  });
}

function selfURLWithoutQueryParams() {
  const url = new URL(location.href);
  const params = url.searchParams;
  for (const key of params.keys()) {
    params.delete(key);
  }
  return url;
}

function formatDate(date) {
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`;
}

function renderFestivalList(festivals) {
  const container = document.getElementById('container');
  const list = document.createElement('ul');
  for (const region in festivals) {
    for (const fes of festivals[region].festivals) {

      const start_date = formatDate(new Date(fes.times.start * 1000));
      const end_date = formatDate(new Date(fes.times.end * 1000));
      const api = festivalRankingAPIURL(region, fes.festival_id);
      const targetURL = selfURLWithoutQueryParams();
      targetURL.searchParams.append('region', region);
      targetURL.searchParams.append('festival_id', fes.festival_id);

      const text = escapeHtml(`${fes.names.alpha_short} vs ${fes.names.bravo_short} ${start_date}-${end_date} (region:${region})`);
      const html = `
        <img src="${IMAGE_BASE + fes.images.panel}" height="60px">
        <a href="${targetURL.href}">${text}</a>&nbsp;<a href="${escapeHtml(api)}">JSON</a>
      `

      const li = document.createElement('li');
      li.innerHTML = html;
      list.appendChild(li);
    }
  }
  container.appendChild(list);
}

function flattenFestivalRankingData(festival_ranking, region, festival_id) {
  const rankings = festival_ranking.rankings;
  // console.log(rankings);
  let flattened_data = [[
    // header
    'region', 'festival_id',
    'team', 'order', 'score', 'nickname',
    'unique_id', 'principal_id',
    'updated_time',
    'weapon_id', 'weapon_name',
    'is_cheater'
  ]];
  for (const team in rankings) {
    for (const r of rankings[team]) {
      const data = {
        'region': region,
        'festival_id': festival_id,
        'team': team,
        'order': r.order,
        'score': r.score,
        'nickname': r.info ? r.info.nickname : undefined,
        'unique_id': r.unique_id,
        'principal_id': r.principal_id,
        'updated_time': r.updated_time,
        'weapon_id': r.info ? r.info.weapon.id : undefined,
        'weapon_name': r.info ? r.info.weapon.name : undefined,
        'cheate': r.cheater
      }
      flattened_data.push(data);
    }
  }
  return flattened_data;
}

function flattenedFestivalRankingData2TSV(data) {
  return [
    // header
    'region',
    'festival_id',
    'team',
    'order',
    'score',
    'nickname',
    'unique_id',
    'principal_id',
    'updated_time',
    'weapon_id',
    'weapon_name',
    'is_cheater'
  ].join('\t') + data.map(r =>
    [
      r['region'],
      r['festival_id'],
      r['team'],
      r['order'],
      r['score'],
      r['nickname'],
      r['unique_id'],
      r['principal_id'],
      r['updated_time'],
      r['weapon_id'],
      r['weapon_name'],
      r['is_cheater']
    ].join('\t')
  ).join('\n');
}

function renderPreText(text) {
  const container = document.getElementById('container');
  const pre = document.createElement('pre');
  pre.innerText = text;
  container.appendChild(pre);
}

function renderFestivalRanking(festival_ranking, region, festival_id) {
  const tsv = flattenedFestivalRankingData2TSV(
    flattenFestivalRankingData(festival_ranking, region, festival_id));
  renderPreText(tsv);
  console.log(tsv);
}

function doAll() {
  fetchFestivals().then(festivals => {
    let fes_data_tsv = [
      [
        'region_festival_id', // <region>:<festival_id>
        'region',
        'festival_id',
        'names/vs_name',
        'names/alpha_short',
        'names/alpha_long',
        'names/bravo_short',
        'names/bravo_long',
        'times/announce',
        'times/start',
        'times/end',
        'times/result',
        'images/panel',
        'images/bravo',
        'images/alpha',
        'colors/alpha/a',
        'colors/alpha/r',
        'colors/alpha/g',
        'colors/alpha/b',
        'colors/bravo/a',
        'colors/bravo/r',
        'colors/bravo/g',
        'colors/bravo/b',
        'colors/middle/a',
        'colors/middle/r',
        'colors/middle/g',
        'colors/middle/b',
      ].join('\t')
    ];
    for (const region in festivals) {
      for (const fes of festivals[region].festivals) {
        fes_data_tsv.push(
          [
            `${region}:${fes.festival_id}`,
            region,
            fes.festival_id,
            `${fes.names.alpha_short} vs ${fes.names.bravo_short}`,
            `"${fes.names.alpha_short}"`,
            `"${fes.names.alpha_long}"`,
            `"${fes.names.bravo_short}"`,
            `"${fes.names.bravo_long}"`,
            fes.times.announce,
            fes.times.start,
            fes.times.end,
            fes.times.result,
            fes.images.panel,
            fes.images.bravo,
            fes.images.alpha,
            fes.colors.alpha.a,
            fes.colors.alpha.r,
            fes.colors.alpha.g,
            fes.colors.alpha.b,
            fes.colors.bravo.a,
            fes.colors.bravo.r,
            fes.colors.bravo.g,
            fes.colors.bravo.b,
            fes.colors.middle.a,
            fes.colors.middle.r,
            fes.colors.middle.g,
            fes.colors.middle.b
          ].join('\t')
        );
      }
    }
    renderPreText(fes_data_tsv.join('\n'));

    let region_fes_pairs = [];
    for (const region in festivals) {
      for (const fes of festivals[region].festivals) {
        region_fes_pairs.push({'region': region, 'fes': fes});
      }
    }
    Promise.all(region_fes_pairs.map(pair =>
      fetchFestivalRanking(pair.region, pair.fes.festival_id)))
      .then(values => {
        const result = values.flatMap((v, i) =>
          flattenFestivalRankingData(v, region_fes_pairs[i].region,
            region_fes_pairs[i].fes.festival_id))
        const tsv = flattenedFestivalRankingData2TSV(result);
        renderPreText(tsv);
        console.log(tsv);
      });
  });
}

function escapeHtml(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function main() {
  const urlParams = new URLSearchParams(window.location.search);
  const region = urlParams.get('region');
  const festival_id = urlParams.get('festival_id');
  if (region && festival_id) {
    console.log(region);
    console.log(festival_id);
    fetchFestivalRanking(region, festival_id).then(r => {
      return renderFestivalRanking(r, region, festival_id);
    });
  } else if (urlParams.get('all')) {
    doAll();
  } else {
    fetchFestivals().then(renderFestivalList);
  }
}

main();
