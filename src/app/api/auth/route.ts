import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Zajištění existence souboru
async function getUsersFile() {
    const filePath = path.join(process.cwd(), 'users.json');
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            await fs.writeFile(filePath, JSON.stringify([]), 'utf8');
            return [];
        }
        throw err;
    }
}

async function saveUsersFile(users: any[]) {
    const filePath = path.join(process.cwd(), 'users.json');
    await fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8');
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, email, password, name, questionnaireData } = body;

        const users = await getUsersFile();

        if (action === 'register') {
            // Check context
            const exists = users.find((u: any) => u.email === email);
            if (exists) {
                return NextResponse.json({ error: 'User already exists' }, { status: 400 });
            }

            const newUser = {
                id: Date.now().toString(),
                email,
                password, // In a real app we'd hash this!
                name: name || email.split('@')[0],
                credits: 100, // starting credits
                questionnaireData: null
            };

            users.push(newUser);
            await saveUsersFile(users);

            return NextResponse.json({
                message: 'Registered successfully',
                user: { id: newUser.id, email: newUser.email, name: newUser.name, credits: newUser.credits, questionnaireData: newUser.questionnaireData }
            });
        }

        if (action === 'login') {
            const user = users.find((u: any) => u.email === email && u.password === password);
            if (!user) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            return NextResponse.json({
                message: 'Logged in successfully',
                user: { id: user.id, email: user.email, name: user.name, credits: user.credits, questionnaireData: user.questionnaireData }
            });
        }

        if (action === 'update_data') {
            const { id } = body;
            const userIndex = users.findIndex((u: any) => u.id === id);
            if (userIndex === -1) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            if (questionnaireData !== undefined) {
                users[userIndex].questionnaireData = questionnaireData;
            }

            await saveUsersFile(users);
            return NextResponse.json({
                message: 'Data updated successfully',
                user: {
                    id: users[userIndex].id,
                    email: users[userIndex].email,
                    name: users[userIndex].name,
                    credits: users[userIndex].credits,
                    questionnaireData: users[userIndex].questionnaireData
                }
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
