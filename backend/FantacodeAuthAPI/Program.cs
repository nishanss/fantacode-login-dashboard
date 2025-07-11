using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using AspNetCoreRateLimit; 
using Microsoft.AspNetCore.Authorization; 
using Microsoft.OpenApi.Models;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Add Redis connection
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
});

// Configure Redis for rate limiting
builder.Services.AddSingleton<IConnectionMultiplexer>(provider =>
{
    var connectionString = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    return ConnectionMultiplexer.Connect(connectionString);
});

builder.Services.AddMemoryCache(); 

// Configure IP rate limiting with Redis - load from appsettings.json
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));

// Use Redis for distributed rate limiting
builder.Services.AddSingleton<IRateLimitCounterStore, DistributedCacheRateLimitCounterStore>();
builder.Services.AddSingleton<IIpPolicyStore, DistributedCacheIpPolicyStore>();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();

builder.Services.AddHttpContextAccessor(); 
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "FantacodeAuthAPI", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer", 
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your token in the text input below.\n\nExample: \"Bearer 12345abcdef\"",
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, 
        ValidateAudience = true, 
        ValidateLifetime = true, 
        ValidateIssuerSigningKey = true, 

        ValidIssuer = jwtSettings["Issuer"], 
        ValidAudience = jwtSettings["Audience"], 
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!)) 
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireLoggedIn", policy => policy.RequireAuthenticatedUser());
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            policy.WithOrigins("http://localhost:4200") 
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); 
        });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseCors();
app.UseIpRateLimiting();
app.UseAuthentication(); 
app.UseAuthorization();
app.MapControllers();

app.Run();