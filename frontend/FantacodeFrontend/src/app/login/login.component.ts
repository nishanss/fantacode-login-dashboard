// src/app/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false, // Keep this as per your working version
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    console.log('LoginComponent constructor initialized.');
  }

  ngOnInit(): void {
    console.log('LoginComponent ngOnInit: Subscribing to isLoggedIn.');
    this.authService.isLoggedIn.subscribe(loggedIn => {
      console.log('LoginComponent ngOnInit: isLoggedIn changed to:', loggedIn);
      if (loggedIn) {
        console.log('LoginComponent ngOnInit: User is logged in, navigating to /dashboard.');
        this.router.navigate(['/dashboard']);
      } else {
        console.log('LoginComponent ngOnInit: User is NOT logged in.');
      }
    });
  }

  loading = false;
  onSubmit() {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Invalid username or password';
      }
    });
  
    const { username, password } = this.loginForm.value;

    this.authService.login({ username, password }).subscribe({
      next: (response) => {
        console.log('LoginComponent onSubmit next: Login successful, response handled by AuthService tap.');
        // The subscription in ngOnInit should now handle the redirection automatically
      },
      error: (err) => {
        this.errorMessage = err.message || 'Login failed. Please try again.';
        console.error('LoginComponent onSubmit error:', err);
      }
    });
  }
}
