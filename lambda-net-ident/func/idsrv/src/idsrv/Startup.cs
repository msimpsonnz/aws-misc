using IdentityServer4;
using IdentityServer4.Quickstart.UI;
using IdentityServer4.Services;
using IdentityServer4.Validation;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;

namespace IdentityServer4Demo
{
    public class Startup
    {
        public IConfiguration Configuration { get; }

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllersWithViews();
            
            // cookie policy to deal with temporary browser incompatibilities
            services.AddSameSiteCookiePolicy();

            RSA privateRsa = RSA.Create();
            privateRsa.FromXmlString("<RSAKeyValue><Modulus>niwszppYY81jN+LO9riMlDVFXCuChYK4NpmnhV7SjRksFfs397jYu07fcGNVWEBppeJ1WZEFILypPjRRfARgwKa4Lu0633cPYG+amyKRYgTGyvbEjvWJ/yvyqimuPrbrI8Bv6FemwCrOoxYIST0pwEHPx6f8SMxKAE9nXP5xcshrudNUZkK9/B17T1HLk9uAzg52cPIM0SChrhfsklcToaycrUQgtFLYWdVEacaSXNo4q1G2ItgHqhM6vHQ5SMcrQ7O+7hlyD5dXkIXItHY4KlHx6yhBp6o0C2237cjIpP1bJaaarFYkHIyWnJ4BET5JXhgVx8j4N6T4S5cNsuy0Rw==</Modulus><Exponent>AQAB</Exponent><P>z+QmIhCL5mnTTMfIxUIyl/TtYKq3uKVrY314ysTlUfVUhO1fIvkRcBEZJkrAP5en/xcTq7wAjbVtCojPF9W9j82r3HP6+/oQsBBplLAIqk4IakdyW2Z0WyUmBHtBtGqvBM32kzkwAXUsSD3thf2VUo5bnoD+lutsu8ToDUj5iA8=</P><Q>wsaaezOZE1pXFv/eP99/5eQtCei3kol3ASlS6BM70XILZC5f50Wvmxjcj616pCw58fm/1G2BMqdD/A4THvoL8ycu1YyGw4Wz01RX+pjQ62rVK06VP9jYHPU5z3Z4TxOoG9AXmLUGgJTE90xoO850UM67hTiZwFSxvkohn/lEmEk=</Q><DP>N+vaKh2jVFaxJR00r4MwEtoqpG8nvn6Y1Ylh3cF7IkHI+3zSs5imDSw8RKWk8zY7VY4Cl5aZ24SrEUNd2b6AIFel3EZChFdu971ieUGlAxK8hsIzS8zSjdX/VQNG2F4+OB+jLVUbybiYMdKeuwVMjomGsatnUHeBpzy/Yxt3LBc=</DP><DQ>fi9ggZSqBSmv5kyZ1dOb7nnm29aSpzK7kFsPRR7A0C4MRzjsFM7Gt7phmguPurCUUbm1l4/h9cj7eF498QGZoEuwQdUqsZz7JVwtK0K5hurNc6MTeiunxwrwCwH7a2+Wp34m613L+p1nBbfQh353SKrGPcavhTTZeihYpGU/FVE=</DQ><InverseQ>lexYRT2hsl2cR4ugwAggnt8g/Tbelz+8A/Y9RhkXAFdfQvg19Ih2spgnjO+x+9kVugHX403DPuwqIMF6+S+KkisbOngB55T9KrS5paaBfMU+xjyV/PorqzQVLkwRLqlEVawLFB8JhtgRAV2XNCmA1sAbKZi5VwVj0b7euw9QE/Y=</InverseQ><D>DngGBUQzL7X7DIKv4fvRyEDzPlIwl1v00/HMVDPvWL7jvIMFhKChGslFQTek9/S0dVs41t+gM3VumeUZSxnva9AUax6CUyzF+FFdODG6UNgVAz39jwJBBFmV0iEL8mqzKcsRsZRLCasgyeRbD7ALoK2kfyQLvPELF+orj2MrJ4+vDWTt4a4NY/zVuzBRBOJhhdzJNRMf+WJuHLvJUBJdDkgz6OzeuBSFS4rMsfBQIWgczLIc59kPnrGMCZ/IoB68BbJvL1DAIc3sYLCLfB+Q8IXvaE4bStLAPXXC1CzZtgZgtkSoZLXqEn+pQF/hgcgmI1Nd0RR7tQjVhV59YvFlUQ==</D></RSAKeyValue>");
            var privateKey = new RsaSecurityKey(privateRsa);
            SigningCredentials signingCredentials = new SigningCredentials(privateKey, SecurityAlgorithms.RsaSha256);
            services.AddIdentityServer(options =>
            {
                options.Events.RaiseErrorEvents = true;
                options.Events.RaiseFailureEvents = true;
                options.Events.RaiseInformationEvents = true;
                options.Events.RaiseSuccessEvents = true;
            })
                .AddInMemoryApiResources(Config.GetApis())
                .AddInMemoryIdentityResources(Config.GetIdentityResources())
                .AddInMemoryClients(Config.GetClients())
                .AddTestUsers(TestUsers.Users)
                .AddSigningCredential(signingCredentials);
                //.AddDeveloperSigningCredential(persistKey: false);

            services.AddAuthentication()
                .AddLocalApi(options =>
                {
                    options.ExpectedScope = "api";
                });

            // preserve OIDC state in cache (solves problems with AAD and URL lenghts)
            services.AddOidcStateDataFormatterCache("aad");

            // add CORS policy for non-IdentityServer endpoints
            services.AddCors(options =>
            {
                options.AddPolicy("api", policy =>
                {
                    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
                });
            });

            // demo versions (never use in production)
            services.AddTransient<IRedirectUriValidator, DemoRedirectValidator>();
            services.AddTransient<ICorsPolicyService, DemoCorsPolicy>();
        }

        public void Configure(IApplicationBuilder app)
        {
            app.UseCookiePolicy();
            //app.UseSerilogRequestLogging();
            app.UseDeveloperExceptionPage();

            //app.UseCors("api");

            app.UseStaticFiles();

            app.UseRouting();
            app.UseIdentityServer();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapDefaultControllerRoute();
            });
        }
    }
}