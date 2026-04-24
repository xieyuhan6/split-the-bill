export type Language = "en" | "zh";

type Copy = {
  toggleLabel: string;
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
  };
  trip: {
    title: string;
    placeholder: string;
  };
  people: {
    title: string;
    placeholder: string;
    addButton: string;
    removeButton: string;
    empty: string;
  };
  expense: {
    title: string;
    aiLabel: string;
    aiPlaceholder: string;
    aiButton: string;
    clearButton: string;
    aiNote: string;
    titlePlaceholder: string;
    amountPlaceholder: string;
    payerPlaceholder: string;
    addExpenseButton: string;
    participants: string;
    adjustments: string;
    addAdjustmentButton: string;
    removeButton: string;
  };
  summary: {
    title: string;
    tripLabel: string;
    calculateButton: string;
    printButton: string;
    rateMode: string;
    manualRates: string;
    liveRates: string;
    sameCurrencyManual: string;
    loadingLiveRates: string;
    liveRatesLoaded: string;
    sameCurrencyLive: string;
    trip: string;
    generated: string;
    person: string;
    paid: string;
    owed: string;
    net: string;
    transfers: string;
    noTransfers: string;
    expenseDetails: string;
    noExpenseDetails: string;
    addData: string;
    calculationLabel: string;
    sharedPoolLabel: string;
    finalSettlementLabel: string;
  };
  drafts: {
    title: string;
    payer: string;
    participants: string;
    deleteButton: string;
    empty: string;
  };
};

export const copyByLanguage: Record<Language, Copy> = {
  en: {
    toggleLabel: "中文",
    hero: {
      kicker: "SplitBill",
      title: "One-Time Trip Split Calculator",
      subtitle: "No database, no saved records. Enter, calculate, print.",
    },
    trip: {
      title: "Trip",
      placeholder: "Trip name",
    },
    people: {
      title: "People",
      placeholder: "Name",
      addButton: "Add",
      removeButton: "Remove",
      empty: "No people yet.",
    },
    expense: {
      title: "Add Expense",
      aiLabel: "AI autofill",
      aiPlaceholder: "Example: I paid 240 HKD first, split among 4 people, A skipped dinner and should pay 30 less",
      aiButton: "AI Autofill",
      clearButton: "Clear",
      aiNote: "Local parsing, no token usage",
      titlePlaceholder: "Title",
      amountPlaceholder: "Amount",
      payerPlaceholder: "Choose payer",
      addExpenseButton: "Add Expense",
      participants: "Participants",
      adjustments: "Adjustments",
      addAdjustmentButton: "Add Adjustment",
      removeButton: "Remove",
    },
    summary: {
      title: "Summary",
      tripLabel: "Trip",
      calculateButton: "Calculate",
      printButton: "Print",
      rateMode: "Rate mode",
      manualRates: "Manual rates",
      liveRates: "Live rates",
      sameCurrencyManual: "No exchange rates needed for same-currency expenses.",
      loadingLiveRates: "Loading live rates...",
      liveRatesLoaded: "Live rates loaded from",
      sameCurrencyLive: "No live exchange rates needed for same-currency expenses.",
      trip: "Trip",
      generated: "Generated",
      person: "Person",
      paid: "Paid",
      owed: "Owed",
      net: "Net",
      transfers: "Transfers",
      noTransfers: "No transfers needed.",
      expenseDetails: "Expense Details",
      noExpenseDetails: "No expense details.",
      addData: "Add data and click Calculate.",
      calculationLabel: "Calculation",
      sharedPoolLabel: "Shared pool split",
      finalSettlementLabel: "Final settlement",
    },
    drafts: {
      title: "Expense Drafts",
      payer: "Payer",
      participants: "Participants",
      deleteButton: "Delete",
      empty: "No expense drafts yet.",
    },
  },
  zh: {
    toggleLabel: "English",
    hero: {
      kicker: "SplitBill",
      title: "一次性行程分账计算器",
      subtitle: "不保存数据库，不保留记录。输入、计算、打印。",
    },
    trip: {
      title: "行程",
      placeholder: "行程名称",
    },
    people: {
      title: "成员",
      placeholder: "姓名",
      addButton: "添加",
      removeButton: "移除",
      empty: "还没有成员。",
    },
    expense: {
      title: "添加支出",
      aiLabel: "AI 自动填充",
      aiPlaceholder: "例如：我先付了 240 港币，4 个人平摊，A 没吃晚饭，需要少付 30",
      aiButton: "AI 自动填充",
      clearButton: "清空",
      aiNote: "本地解析，不消耗 token",
      titlePlaceholder: "标题",
      amountPlaceholder: "金额",
      payerPlaceholder: "选择付款人",
      addExpenseButton: "添加支出",
      participants: "参与成员",
      adjustments: "调整项",
      addAdjustmentButton: "添加调整",
      removeButton: "移除",
    },
    summary: {
      title: "汇总",
      tripLabel: "行程",
      calculateButton: "计算",
      printButton: "打印",
      rateMode: "汇率模式",
      manualRates: "手动汇率",
      liveRates: "实时汇率",
      sameCurrencyManual: "同币种支出不需要汇率。",
      loadingLiveRates: "正在加载实时汇率...",
      liveRatesLoaded: "实时汇率已加载，来源",
      sameCurrencyLive: "同币种支出不需要实时汇率。",
      trip: "行程",
      generated: "生成时间",
      person: "成员",
      paid: "已付",
      owed: "应付",
      net: "净额",
      transfers: "转账",
      noTransfers: "无需转账。",
      expenseDetails: "支出明细",
      noExpenseDetails: "暂无支出明细。",
      addData: "先添加数据，再点击计算。",
      calculationLabel: "计算过程",
      sharedPoolLabel: "公共池分摊",
      finalSettlementLabel: "最终结算",
    },
    drafts: {
      title: "支出草稿",
      payer: "付款人",
      participants: "参与成员",
      deleteButton: "删除",
      empty: "还没有支出草稿。",
    },
  },
};

export function getSplitBillCopy(language: Language) {
  return copyByLanguage[language];
}