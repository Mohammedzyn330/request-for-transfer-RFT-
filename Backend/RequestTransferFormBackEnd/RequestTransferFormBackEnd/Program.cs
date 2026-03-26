using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Services;

var builder = WebApplication.CreateBuilder(args);

// Increase file upload size if needed
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 104857600; // 100 MB
});

// File upload service
builder.Services.AddScoped<IFileUploadService, FileUploadService>();

// Database context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.CommandTimeout(120); // 120 seconds
        }
    )
);

//builder.Services.AddCors(options =>
//{
//    options.AddPolicy("AllowReactApp",
//        builder =>
//        {
//            builder.WithOrigins("http://localhost:3000")
//                   .AllowAnyHeader()
//                   .AllowAnyMethod();
//        });
//});
//FOR DEPLOYEMENT
//CORS (allow React dev server if needed)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()    // For production, remove AllowAnyOrigin and set correct URLs
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});



builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Swagger only in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Serve frontend static files
app.UseStaticFiles();

// Enable CORS
app.UseCors("AllowReactApp");

app.UseAuthorization();

app.MapControllers();

// Serve index.html for React routes
app.MapFallbackToFile("index.html");

app.Run();
