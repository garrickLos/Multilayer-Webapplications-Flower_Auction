// using Azure.Storage.Blobs;
// using Microsoft.AspNetCore.Http;
// using mvc_api.Interfaces;

// namespace mvc_api.Services;

// public class AzureBlobImageStorageService : IImageStorageService
// {
//     private readonly BlobServiceClient _blobServiceClient;

//     public AzureBlobImageStorageService(BlobServiceClient blobServiceClient)
//     {
//         _blobServiceClient = blobServiceClient;
//     }

//     public async Task<string> UploadImageAsync(IFormFile file, CancellationToken ct)
//     {
//         var container = _blobServiceClient.GetBlobContainerClient("productimages");
//         await container.CreateIfNotExistsAsync();

//         // Maak bestandsnaam uniek
//         var fileName = $"{Guid.NewGuid()}_{file.FileName}";
//         var blobClient = container.GetBlobClient(fileName);

//         await using var stream = file.OpenReadStream();
//         await blobClient.UploadAsync(stream, overwrite: true, cancellationToken: ct);

//         return blobClient.Uri.ToString(); // URL die later in DB opgeslagen wordt
//     }
// }
