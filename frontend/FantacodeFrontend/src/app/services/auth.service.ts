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
    
    // Log the full error object to understand its structure
    console.error('AuthService handleError: Full error object:', error);
    console.error('AuthService handleError: Error status:', error.status);
    console.error('AuthService handleError: Error message (from error.message):', error.message);
    console.error('AuthService handleError: Error.error content:', error.error);


    if (error.error instanceof ErrorEvent) {
      // Client-side error (e.g., network error before response)
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error (HTTP status code received)
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid username or password.';
          break;
        case 429:
          // Prioritize the message from the backend's error.error property
          // The backend sends "Too many requests. Please try again later." as a plain string in the body
          errorMessage = typeof error.error === 'string'
                         ? error.error // Backend sends plain string message
                         : (error.error && error.error.message)
                           ? error.error.message // Backend sends { message: "..." }
                           : 'Too many requests. Please try again later.'; // Fallback generic message
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 0:
          // This case is often hit for network issues, CORS preflight failures,
          // or when the browser aborts the request/response.
          // If a 429 was truly sent, but client sees 0, it's a client-side network/browser issue.
          // We'll keep this as a fallback for true connection issues.
          errorMessage = 'Unable to connect to server. Please check your connection.';
          break;
        default:
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else {
            errorMessage = `Server returned code ${error.status}. Please try again.`;
          }
      }
    }
    
    console.error('AuthService handleError: Final error message for display:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
