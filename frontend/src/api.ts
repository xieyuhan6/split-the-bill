import type { Expense, Group, Member, SettlementResponse } from "./types";

type ExpensePayload = {
  paid_by_member_id: number;
  title: string;
  amount: number;
  currency: string;
  fx_rate?: number;
  occurred_at: string;
  note?: string;
  participants: Array<{
    member_id: number;
    split_type: "equal" | "percentage" | "fixed";
    split_value: number;
  }>;
  adjustments: Array<{
    member_id: number;
    delta_amount: number;
    currency: string;
    reason?: string;
  }>;
};

async function request<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const payload = JSON.parse(text) as { detail?: string };
      throw new Error(payload.detail || text || `Request failed (${response.status})`);
    } catch {
      throw new Error(text || `Request failed (${response.status})`);
    }
  }

  return (await response.json()) as T;
}

export async function listGroups(baseUrl: string): Promise<Group[]> {
  return request<Group[]>(baseUrl, "/groups");
}

export async function createGroup(
  baseUrl: string,
  payload: { name: string; base_currency?: string }
): Promise<Group> {
  return request<Group>(baseUrl, "/groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteGroup(baseUrl: string, groupId: number): Promise<void> {
  const response = await fetch(`${baseUrl}/groups/${groupId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }
}

export async function listMembers(baseUrl: string, groupId: number): Promise<Member[]> {
  return request<Member[]>(baseUrl, `/groups/${groupId}/members`);
}

export async function createMember(baseUrl: string, groupId: number, payload: { display_name: string; email?: string }): Promise<Member> {
  return request<Member>(baseUrl, `/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listExpenses(baseUrl: string, groupId: number): Promise<Expense[]> {
  return request<Expense[]>(baseUrl, `/groups/${groupId}/expenses`);
}

export async function createExpense(baseUrl: string, groupId: number, payload: ExpensePayload): Promise<Expense> {
  return request<Expense>(baseUrl, `/groups/${groupId}/expenses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteExpense(baseUrl: string, groupId: number, expenseId: number): Promise<void> {
  const response = await fetch(`${baseUrl}/groups/${groupId}/expenses/${expenseId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const payload = JSON.parse(text) as { detail?: string };
      throw new Error(payload.detail || text || `Request failed (${response.status})`);
    } catch {
      throw new Error(text || `Request failed (${response.status})`);
    }
  }
}

export async function getSettlement(baseUrl: string, groupId: number): Promise<SettlementResponse> {
  return request<SettlementResponse>(baseUrl, `/groups/${groupId}/settlement`);
}
