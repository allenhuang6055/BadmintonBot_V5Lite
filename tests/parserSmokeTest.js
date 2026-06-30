const { parseByFuzzyLines, hasAnyLabel } = require("../services/parser");

const incomeLabels = ["零打", "球券", "會員", "活動", "贊助", "其他", "耗球"];
const expenseLabels = ["買球", "場租", "聚餐", "比賽", "行政", "雜支", "其他"];

function assert(name, condition, detail = "") {
  if (!condition) {
    console.error(`❌ ${name} failed ${detail}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ ${name}`);
  }
}

const income = parseByFuzzyLines("零打：1200元\n球劵：1600元\n贊助：1000元\n耗球：20顆", incomeLabels);
assert("income 零打", income.result["零打"] === 1200);
assert("income 球劵->球券", income.result["球券"] === 1600);
assert("income 贊助", income.result["贊助"] === 1000);
assert("income 耗球", income.result["耗球"] === 20);

const expense = parseByFuzzyLines("支出\n買球5\n場租66\n餐點4\n雜支4\n其他4", expenseLabels);
assert("expense 買球", expense.result["買球"] === 5);
assert("expense 場租", expense.result["場租"] === 66);
assert("expense 餐點->聚餐", expense.result["聚餐"] === 4);
assert("expense 雜支", expense.result["雜支"] === 4);
assert("expense 其他", expense.result["其他"] === 4);

assert("payment detect", hasAnyLabel("幹部交款\n交款：4000000\n備註：", ["交款"]));
assert("payment not income", !hasAnyLabel("幹部交款\n交款：4000000\n備註：", incomeLabels));
assert("payment not expense", !hasAnyLabel("幹部交款\n交款：4000000\n備註：", expenseLabels));
