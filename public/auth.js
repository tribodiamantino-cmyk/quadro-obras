/**
 * Auth Helper - Gerencia autenticação no frontend
 */
(function() {
  'use strict';

  window.Auth = {
    /**
     * Verifica se usuário está autenticado
     */
    isAuthenticated() {
      return !!localStorage.getItem('token');
    },

    /**
     * Retorna o token JWT
     */
    getToken() {
      return localStorage.getItem('token');
    },

    /**
     * Retorna dados do usuário
     */
    getUser() {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Salva token e usuário
     */
    setAuth(token, user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },

    /**
     * Faz logout
     */
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
    },

    /**
     * Redireciona para login se não autenticado
     */
    requireAuth() {
      if (!this.isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
      }
      return true;
    },

    /**
     * Faz requisição autenticada
     */
    async fetch(url, options = {}) {
      const token = this.getToken();
      
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers
      });

      // Se 401, token expirou - faz logout
      if (response.status === 401) {
        this.logout();
        throw new Error('Sessão expirada');
      }

      return response;
    }
  };

  // Atalho global
  window.api = function(path, opts = {}) {
    return window.Auth.fetch(path, opts);
  };

})();
