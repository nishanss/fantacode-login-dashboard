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
  loading = false; // Declare loading property here

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

  onSubmit() {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please enter both username and password.';
      return;
    }

    this.loading = true;
    this.errorMessage = ''; // Clear any previous error messages

    // Single call to authService.login
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => { // Keep response for logging if needed
        console.log('LoginComponent onSubmit next: Login successful, response handled by AuthService tap.');
        this.loading = false;
        // Redirection is handled by ngOnInit subscription
      },
      error: (err) => {
        this.loading = false;
        // Use the error message from AuthService's handleError
        this.errorMessage = err.message || 'Login failed. Please try again.';
        console.error('LoginComponent onSubmit error:', err);
      }
    });
  }
}
