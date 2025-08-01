import { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { useRouter } from 'next/router';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/matchlawyer/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || '登录失败');
            }

            await router.push('/matchlawyer/industries');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
        }}>
            <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    管理员登录
                </Typography>
                <form onSubmit={handleSubmit} data-testid="login-form">
                    <TextField
                        fullWidth
                        label="邮箱"
                        margin="normal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        inputProps={{
                            'data-testid': 'email-input',
                            'aria-label': '邮箱输入框'
                        }}
                    />
                    <TextField
                        fullWidth
                        label="密码"
                        type="password"
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        inputProps={{
                            'data-testid': 'password-input',
                            'aria-label': '密码输入框'
                        }}
                    />
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }} data-testid="error-message">
                            {error}
                        </Alert>
                    )}
                    <Button
                        fullWidth
                        variant="contained"
                        type="submit"
                        sx={{ mt: 3 }}
                        disabled={loading}
                        data-testid="login-button"
                    >
                        {loading ? '登录中...' : '登录'}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
} 