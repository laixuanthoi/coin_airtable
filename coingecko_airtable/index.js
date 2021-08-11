const config = require("./config/config.js").config;
// COINGECKO
const CoinGecko = require("coingecko-api");
const CoinGeckoClient = new CoinGecko();
// AIRTABLE
const Airtable = require("airtable");

const updateRecord = (base, table, newData) => {
  return new Promise((resolve, reject) => {
    base(table).update(newData, function (err, records) {
      if (err) {
        reject(err);
      }
      resolve("updated");
      //   records.forEach(function (record) {
      //     resolve(record.get("id") + " updated");
      //   });
    });
  });
};

const readRecords = (base, table, view) => {
  return new Promise((resolve, reject) => {
    base(table)
      .select({
        view: view,
      })
      .eachPage(
        function page(records, fetchNextPage) {
          resolve(records);
          fetchNextPage();
        },
        function done(err) {
          if (err) {
            reject(err);
          }
        }
      );
  });
};
const RetrieveAndUpdate = async (base, table, view) => {
  let records = await readRecords(base, table, view);
  records = records.filter((record) => record.get("id") != undefined);
  const coinIds = records.map((record) => record.get("id").trim());

  const response = await CoinGeckoClient.coins.markets({
    ids: coinIds,
  });

  if (response.code != 200) return;
  const data = response.data;
  const needUpdateData = data.map((d) => {
    return {
      id: records.filter((r) => r.get("id") === d.id)[0].id,
      fields: {
        id: d.id,
        name: d.name,
        symbol: d.symbol,
        current_price: d.current_price,
        image: d.image,
        market_cap: d.market_cap,
        market_cap_rank: d.market_cap_rank,
        total_volume: d.total_volume,
        fully_diluted_valuation: d.fully_diluted_valuation,
        price_change_percentage_24h: d.price_change_percentage_24h / 100,
        circulating_supply: d.circulating_supply,
        total_supply: d.total_supply,
        max_supply: d.max_supply,
        total_value_locked: d.total_value_locked || null,
        market_cap_change_24h: d.market_cap_change_24h,
        market_cap_change_percentage_24h:
          d.market_cap_change_percentage_24h / 100,
        ath: d.ath,
      },
    };
  });

  await updateRecord(base, table, needUpdateData);
};

(() => {
  config.airtable.bases.map((b) => {
    const base = new Airtable({ apiKey: config.airtable.API_key }).base(b.base);
    RetrieveAndUpdate(base, b.table, b.view);
  });
})();
