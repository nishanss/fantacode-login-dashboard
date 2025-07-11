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
  public chartData: any[] = [];

  public view: [number, number] = [700, 400]; 
  public showXAxis = true;
  public showYAxis = true;
  public gradient = false;
  public showLegend = true;
  public showXAxisLabel = true;
  public xAxisLabel = 'Month';
  public showYAxisLabel = true;
  public yAxisLabel = 'Sales Amount';
  public animations = true;
  
  public colorScheme: any = {
    name: 'myScheme',
    selectable: true,
    group: 'Ordinal',
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'] 
  };

  public errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  fetchDashboardData(): void {
    this.errorMessage = '';

    this.authService.getDashboardData().subscribe({
      next: (data) => {
        console.log('Dashboard data received:', data);
        if (data && data.labels && data.values) {
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

  logout(): void {
    this.authService.logout();
  }
}