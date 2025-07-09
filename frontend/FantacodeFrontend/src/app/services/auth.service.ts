// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5289/api/Auth'; // Adjust port if necessary

  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

  isLoggedIn: Observable<boolean> = this.loggedIn.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    console.log('AuthService constructor: Initial loggedIn state:', this.hasToken());
  }

  private hasToken(): boolean {
    const token = localStorage.getItem('jwt_token');
    console.log('AuthService hasToken(): Token found:', !!token);
    return !!token;
  }

  login(credentials: any): Observable<any> {
    console.log('AuthService login(): Attempting login for:', credentials.username);
    return this.http.post<any>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          console.log('AuthService login() tap: Received response:', response);
          if (response && response.token) {
            localStorage.setItem('jwt_token', response.token);
            console.log('AuthService login() tap: Token stored in localStorage.');
            this.loggedIn.next(true);
            console.log('AuthService login() tap: loggedIn BehaviorSubject updated to true.');
          } else {
            console.warn('AuthService login() tap: Login successful, but no token in response.');
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    console.log('AuthService logout(): Logging out user.');
    localStorage.removeItem('jwt_token');
    this.loggedIn.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  getDashboardData(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      console.warn('AuthService getDashboardData(): No token found, redirecting to login.');
      this.router.navigate(['/login']);
      return throwError(() => new Error('No authentication token found.'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(`${this.apiUrl}/dashboard`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = 'Unauthorized: Invalid credentials or token expired.';
      } else if (error.error && error.error.message) {
        errorMessage = `Server Error: ${error.error.message}`;
      } else {
        errorMessage = `Server returned code ${error.status}, body was: ${error.error}`;
      }
    }
    console.error('AuthService handleError:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
