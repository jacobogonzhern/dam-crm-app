import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Client } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;
  private ready: Promise<void>;

  currentUser = signal<User | null>(null);
  userRole = signal<'admin' | 'user' | null>(null);
  isAdmin = computed(() => this.userRole() === 'admin');

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.ready = this.initSession();
    this.supabase.auth.onAuthStateChange((_e, session) => {
      this.currentUser.set(session?.user ?? null);
      if (!session) this.userRole.set(null);
    });
  }

  // --- AUTENTICACIÓN Y ROLES ---
  private async initSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session?.user) {
      this.currentUser.set(session.user);
      await this.loadRole(session.user.id);
    }
  }

  async isLoggedIn(): Promise<boolean> {
    await this.ready;
    return !!this.currentUser();
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.currentUser.set(data.user);
    await this.loadRole(data.user.id);
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.currentUser.set(null);
    this.userRole.set(null);
  }

  private async loadRole(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles').select('role').eq('id', userId).single();
    if (!error && data) this.userRole.set(data.role);
  }

  // --- CRUD CLIENTES ---
  async getClients(): Promise<Client[]> {
    const { data, error } = await this.supabase
      .from('clients').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createClient(client: Client): Promise<void> {
    const { error } = await this.supabase.from('clients').insert([{
      nombre: client.nombre,
      empresa: client.empresa,
      email: client.email,
    }]);
    if (error) throw error;
  }

  async updateClient(id: string, client: Partial<Client>): Promise<void> {
    const { error } = await this.supabase.from('clients').update(client).eq('id', id);
    if (error) throw error;
  }

  async deleteClient(id: string): Promise<void> {
    const { error } = await this.supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  }
}