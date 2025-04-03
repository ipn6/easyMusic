import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl =  environment.apiUrl;


  private userSubject = new BehaviorSubject<any>(this.getUser());
  user$ = this.userSubject.asObservable(); // Se usa en la navbar para detectar cambios
  
  constructor(private http: HttpClient) { }

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user).pipe(
      tap((response: any) => {
        if (response.token && response.user) {
          localStorage.setItem("token", response.token);
          localStorage.setItem("user", JSON.stringify(response.user));
          this.userSubject.next(response.user); //  Actualizar usuario
        }
      })
    );
  }
  

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.token && response.user) {
          localStorage.setItem("token", response.token);
          localStorage.setItem("user", JSON.stringify(response.user));
          this.userSubject.next(response.user); //  Actualizar usuario
        }
      })
    );
  }

  setUser(user: any) {
    localStorage.setItem("user", JSON.stringify(user));
    this.userSubject.next(user);
  }

  updateUser(updatedUser: any) {
    this.user$ = updatedUser;
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }
  
  

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    this.userSubject.next(null);
  }

  getUser() {
    const user = localStorage.getItem('user');
    console.log(localStorage.getItem('user'));
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem("token");
  }
}