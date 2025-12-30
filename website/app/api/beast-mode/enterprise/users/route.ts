import { NextRequest, NextResponse } from 'next/server';

/**
 * Enterprise Users API
 * 
 * Manage users for enterprise organizations
 */

// In-memory storage (replace with database in production)
let users: any[] = [
  { id: '1', email: 'john@example.com', name: 'John Doe', role: 'admin', team: 'Engineering', createdAt: new Date().toISOString() },
  { id: '2', email: 'jane@example.com', name: 'Jane Smith', role: 'developer', team: 'Engineering', createdAt: new Date().toISOString() },
  { id: '3', email: 'bob@example.com', name: 'Bob Johnson', role: 'viewer', team: 'Product', createdAt: new Date().toISOString() }
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      users,
      count: users.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, role, team, name } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const newUser = {
      id: String(users.length + 1),
      email: email.trim(),
      name: name || '',
      role: role || 'developer',
      team: team || '',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    return NextResponse.json({
      user: newUser,
      message: 'User invited successfully'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to invite user', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, email, name, role, team } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (email) users[userIndex].email = email.trim();
    if (name !== undefined) users[userIndex].name = name;
    if (role) users[userIndex].role = role;
    if (team !== undefined) users[userIndex].team = team;

    return NextResponse.json({
      user: users[userIndex],
      message: 'User updated successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    users.splice(userIndex, 1);

    return NextResponse.json({
      message: 'User removed successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to remove user', details: error.message },
      { status: 500 }
    );
  }
}

