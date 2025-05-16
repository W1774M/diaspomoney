'use client';
import DefaultTemplate from '@/template/DefaultTemplate';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const Page = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    useEffect(() => {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Assuming a function to validate the token exists
        fetch('/api/validate-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.valid) {
              router.push('/');
            }
          });
      }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('authToken', data.token);
          router.push('/');
        } else {
          router.push('/not-authorize');
        }
      } catch (error) {
        console.error('Login failed:', error);
        router.push('/not-authorize');
      }
    };

    return (
      <DefaultTemplate>
      <div className="p-8 text-center">
        <h1>Login</h1>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 p-2 border"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 p-2 border"
            required
          />
          <button type="submit" className="p-2 bg-blue-500 text-white">
            Login
          </button>
        </form>
      </div>
      </DefaultTemplate>
    );
  };

  export default Page;