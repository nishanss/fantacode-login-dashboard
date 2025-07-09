// src/app/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Data for ngx-charts. It expects an array of objects with 'name' and 'value'.
  // For a bar chart, it will be a single series.
  public chartData: any[] = [];

  // ngx-charts options
  public view: [number, number] = [700, 400]; // Chart dimensions [width, height]
  public showXAxis = true;
  public showYAxis = true;
  public gradient = false;
  public showLegend = true;
  public showXAxisLabel = true;
  public xAxisLabel = 'Month';
  public showYAxisLabel = true;
  public yAxisLabel = 'Sales Amount';
  public animations = true;
  
  // FIXED: Use the correct format for ngx-charts color scheme
  public colorScheme: any = {
    name: 'myScheme',
    selectable: true,
    group: 'Ordinal',
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'] // Customize colors
  };

  public errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  /**
   * Fetches dashboard data from the backend using AuthService.
   */
  fetchDashboardData(): void {
    this.errorMessage = '';

    this.authService.getDashboardData().subscribe({
      next: (data) => {
        console.log('Dashboard data received:', data);
        if (data && data.labels && data.values) {
          // Transform backend data into ngx-charts format: [{ name: 'Month', value: Sales }]
          this.chartData = data.labels.map((label: string, index: number) => ({
            name: label,
            value: data.values[index]
          }));
        } else {
          this.errorMessage = 'Invalid data format received from backend.';
        }
      },
      error: (err) => {
        console.error('Error fetching dashboard data:', err);
        this.errorMessage = err.message || 'Failed to load dashboard data.';

        if (err.message && err.message.includes('Unauthorized')) {
          this.authService.logout();
        }
      }
    });
  }

  /**
   * Handles user logout.
   */
  logout(): void {
    this.authService.logout();
  }
}