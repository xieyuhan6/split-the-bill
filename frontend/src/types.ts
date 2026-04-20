export type Group = {
  id: number;
  name: string;
  base_currency: string;
  created_at: string;
};

export type Member = {
  id: number;
  group_id: number;
  display_name: string;
  email: string | null;
  created_at: string;
};

export type Expense = {
  id: number;
  group_id: number;
  paid_by_member_id: number;
  payer_name: string;
  title: string;
  amount: string;
  currency: string;
  fx_rate: string | null;
  occurred_at: string;
  note: string | null;
  created_at: string;
  participant_shares: Array<{
    member_id: number;
    member_name: string;
    split_type: "equal" | "percentage" | "fixed";
    split_value: string;
    owed_amount: string;
    currency: string;
  }>;
  adjustments: Array<{
    member_id: number;
    member_name: string;
    delta_amount: string;
    currency: string;
    reason: string | null;
  }>;
};

export type SettlementMember = {
  member_id: number;
  member_name: string;
  paid: string;
  owed: string;
  net: string;
  currency: string;
};

export type SettlementTransfer = {
  from_member_id: number;
  from_member_name: string;
  to_member_id: number;
  to_member_name: string;
  amount: string;
  currency: string;
};

export type SettlementResponse = {
  base_currency: string;
  members: SettlementMember[];
  transfers: SettlementTransfer[];
};

export type Person = {
  id: number;
  name: string;
};

export type DraftAdjustment = {
  personId: string;
  deltaAmount: string;
};

export type ExpenseDraft = {
  id: number;
  title: string;
  amount: string;
  currency: string;
  spentAt: string;
  payerId: string;
  participantIds: number[];
  adjustments: DraftAdjustment[];
};

export type CalculateResponse = {
  target_currency: string;
  people: Array<{
    person_id: number;
    name: string;
    paid: string;
    owed: string;
    net: string;
    currency: string;
  }>;
  transfers: Array<{
    from_person_id: number;
    from_name: string;
    to_person_id: number;
    to_name: string;
    amount: string;
    currency: string;
  }>;
  expense_details: Array<{
    title_and_amount: string;
    total_line: string;
    adjustment_line: string;
    process_line: string;
    participants_breakdown: string;
    final_breakdown: string;
    final_lines: string[];
    adjustments_display: string;
  }>;
};

export type RateMode = "manual" | "realtime";
