import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  validateApiKey, 
  createErrorResponse, 
  setSecurityHeaders, 
  logAuditEvent 
} from "@/lib/security";
import { checkApiRateLimit } from "@/lib/rate-limit";

/**
 * TEMPLATE FOR ALL PROTECTED API ROUTES
 * Copy this pattern to: src/app/api/[your-endpoint]/route.ts
 */

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION
    const { userId } = await auth();
    if (!userId) {
      await logAuditEvent(null, "UNAUTHORIZED_ACCESS", "api_endpoint", request, "failed");
      return createErrorResponse("Unauthorized", 401);
    }

    // 2. RATE LIMITING
    const remaining = await checkApiRateLimit(userId);
    if (!remaining) {
      await logAuditEvent(userId, "RATE_LIMIT_EXCEEDED", "api_endpoint", request, "failed");
      return createErrorResponse("Rate limit exceeded", 429);
    }

    // 3. INPUT VALIDATION
    let body;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse("Invalid JSON", 400);
    }

    // VALIDATE INPUT HERE
    if (!body.requiredField) {
      return createErrorResponse("Missing required field", 400);
    }

    // 4. BUSINESS LOGIC
    // YOUR CODE HERE
    const result = {
      success: true,
      data: {}, // Your response
    };

    // 5. AUDIT LOG
    await logAuditEvent(userId, "API_CALL_SUCCESS", "api_endpoint", request, "success");

    // 6. SECURITY HEADERS
    let response = NextResponse.json(result);
    response = setSecurityHeaders(response);

    return response;

  } catch (error) {
    console.error("API Error:", error);
    const { userId } = await auth();
    await logAuditEvent(userId || null, "API_ERROR", "api_endpoint", request, "failed");
    return createErrorResponse("Internal server error", 500);
  }
}

/**
 * USAGE:
 * 
 * All POST/GET/PUT/DELETE endpoints should follow this pattern:
 * 1. Authenticate user
 * 2. Check rate limit
 * 3. Validate input
 * 4. Execute logic
 * 5. Log audit event
 * 6. Add security headers
 * 7. Return response
 */
