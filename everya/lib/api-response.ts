import { NextResponse } from "next/server";

export type ApiErrorBody = {
  error: string;
  code?: string;
  details?: unknown;
};

export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(
  message: string,
  status: number,
  code?: string,
  details?: unknown
) {
  const body: ApiErrorBody = { error: message };
  if (code) body.code = code;
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}

export function unauthorized(message = "Unauthorized") {
  return jsonError(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "Forbidden") {
  return jsonError(message, 403, "FORBIDDEN");
}

export function notFound(message = "Not found") {
  return jsonError(message, 404, "NOT_FOUND");
}

export function badRequest(message: string, details?: unknown) {
  return jsonError(message, 400, "BAD_REQUEST", details);
}

export function conflict(message: string) {
  return jsonError(message, 409, "CONFLICT");
}

export function tooManyRequests(message = "Too many requests") {
  return jsonError(message, 429, "RATE_LIMITED");
}
