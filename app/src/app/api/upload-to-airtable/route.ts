import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const response = await fetch(
      'https://hooks.airtable.com/workflows/v1/genericWebhook/appkHcMsdxms1RtSq/wflVUEzgGxZE9Omyp/wtroPBlZUHCWyfp8l',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error('Airtable upload failed');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error uploading to Airtable:', error);
    return NextResponse.json(
      { error: 'Failed to upload to Airtable' },
      { status: 500 }
    );
  }
}
