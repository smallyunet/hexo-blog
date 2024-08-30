function getUrlRelativePath() {
  var url = document.location.toString();
  var arrUrl = url.split("//");

  var start = arrUrl[1].indexOf("/");
  var relUrl = arrUrl[1].substring(start);

  if (relUrl.indexOf("?") != -1) {
    relUrl = relUrl.split("?")[0];
  }
  return relUrl;
}

function preloadMicroBlog(year, forceReload = false) {
  let cacheKey = `micro-blog-${year}`;
  let cacheDateKey = `${cacheKey}-date`;
  let cached = localStorage.getItem(cacheKey);
  let cacheDate = localStorage.getItem(cacheDateKey);

  if (!cached || forceReload) {
    let url = `/micro-blog/${year}.json`;
    $.get(url, (res) => {
      localStorage.setItem(cacheKey, JSON.stringify(res));
      localStorage.setItem(cacheDateKey, new Date().toISOString());
      // console.log(`Data for year ${year} updated and cached`);
    }).fail(() => {
      // console.error(`Failed to preload data for year ${year}`);
    });
  } else {
    // console.log(`Using cached data for year ${year}`);
  }
}

const startPrivateKey = BigInt("0x4968be1cc4ac9f00a12c5294ebe7a92d6a67c78beea662a1a3e2769a9ac42a00");
const endPrivateKey = BigInt("0x4968be1cc4ac9f00a12c5294ebe7a92d6a67c78beea662a1a3e2769a9ac42aff");
function generateRandomPrivateKey() {
  const range = endPrivateKey - startPrivateKey + BigInt(1);
  const randomBigInt = BigInt(Math.floor(Math.random() * Number(range)));
  const randomPrivateKey = startPrivateKey + randomBigInt;
  return '0x' + randomPrivateKey.toString(16).padStart(64, '0');
}
function hackerStyleConsoleOutput(message) {
  console.log(message);
}

$(() => {
  document.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightBlock(block);
  });

  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= 2020; year--) {
    preloadMicroBlog(year, year === currentYear);
  }

  const randomPrivateKey = generateRandomPrivateKey();
  const message = `
  By visiting smallyu's blog, you have obtained a random private key.
  Your private key is: ${randomPrivateKey}
  
  This private key may or may not contain some ETH on the Base network.
  Feel free to check it yourself. Good luck!
  `;
  hackerStyleConsoleOutput(message);
});