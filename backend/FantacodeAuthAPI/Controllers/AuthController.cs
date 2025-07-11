using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FantacodeLoginDashboard.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        private static readonly Dictionary<string, string> Users = new()
        {
            { "user1", "password123" },
            { "admin", "adminpass" }
        };

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginModel model)
        {
            if (Users.TryGetValue(model.Username, out var storedPassword) && storedPassword == model.Password)
            {
                var jwtSettings = _configuration.GetSection("JwtSettings");

                var secretKey = jwtSettings["SecretKey"];
                var issuer = jwtSettings["Issuer"];
                var audience = jwtSettings["Audience"];

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, model.Username),
                    new Claim(ClaimTypes.Name, model.Username),
                    new Claim(ClaimTypes.Role, "User")
                };

                var token = new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    expires: DateTime.UtcNow.AddHours(1),
                    signingCredentials: creds
                );

                var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

                return Ok(new { Message = "Login successful", Token = tokenString });
            }
            return Unauthorized(new { Message = "Invalid credentials" });
        }

        [Authorize]
        [HttpGet("dashboard")]
        public IActionResult Dashboard()
        {
            var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var dashboardData = new
            {
                Labels = new List<string> { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" },
                Values = new List<int> { 120, 150, 130, 180, 200, 160, 220, 210, 190, 230, 240, 250 }
            };

            return Ok(dashboardData);
        }
    }

    public class LoginModel
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
