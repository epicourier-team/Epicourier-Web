// Shopping List Sharing Feature
// Issue #106: Enable users to share shopping lists with family/friends

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Generate shareable link for shopping list
export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { shoppingListId, expiryDays = 7 } = await request.json();

    // Generate unique share token
    const shareToken = crypto.randomUUID();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    // Create share record in database
    const { data, error } = await supabase
      .from("shopping_list_shares")
      .insert({
        shopping_list_id: shoppingListId,
        share_token: shareToken,
        expires_at: expiryDate.toISOString(),
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;

    // Return shareable link
    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL}/share/shopping/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareLink,
      expiryDate,
      token: shareToken,
    });
  } catch (error) {
    console.error("Error generating share link:", error);
    return NextResponse.json(
      { error: "Failed to generate share link" },
      { status: 500 }
    );
  }
}

// Retrieve shared shopping list
export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get("token");

    if (!shareToken) {
      return NextResponse.json(
        { error: "Share token required" },
        { status: 400 }
      );
    }

    // Retrieve shared list
    const { data, error } = await supabase
      .from("shopping_list_shares")
      .select(
        `
        *,
        shopping_lists (
          id,
          name,
          description,
          shopping_list_items (*)
        )
      `
      )
      .eq("share_token", shareToken)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Invalid or expired share link" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      list: data.shopping_lists,
      sharedBy: data.created_at,
    });
  } catch (error) {
    console.error("Error retrieving shared list:", error);
    return NextResponse.json(
      { error: "Failed to retrieve shared list" },
      { status: 500 }
    );
  }
}
