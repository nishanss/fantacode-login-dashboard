import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5289/api/Auth';

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
    
    console.error('AuthService handleError: Full error object:', error);
    console.error('AuthService handleError: Error status:', error.status);
    console.error('AuthService handleError: Error message (from error.message):', error.message);
    console.error('AuthService handleError: Error.error content:', error.error);


    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid username or password.';
          break;
        case 429:
          errorMessage = typeof error.error === 'string'
                         ? error.error
                         : (error.error && error.error.message)
                           ? error.error.message 
                           : 'Too many requests. Please try again later.'; 
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 0:
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
