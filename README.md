# Document Store

## URI Endpoint - https://vk-document-store.herokuapp.com/

## Routes

### GET

**/api/files** - Find all the files that are available in the storage

**/api/download** - Download a particuar file
Filter the file to download by passing query filter

```
https://vk-document-store.herokuapp.com/api/download?fileName={fileName}
```
### POST

**/api/upload** - Upload a file to the storage
Pass the storage location as query parameter

```
https://vk-document-store.herokuapp.com/api/upload?uploadTo={storage}
```
Supported values for Storage - S3 and local

Upload the file using Form-Data and modifying the type as File

### PATCH

**/api/rename** - Rename an existing file 
Pass the file Name and Modified File Name as body parameters

**Sample Payload**

```
{
  "originalFileName": "Filename1",
  "modifiedFileName": "Filename2"
}
```

### DELETE

**/api/delete** - Delete an existing file
Pass the file to be deleted as query parameter

```
https://vk-document-store.herokuapp.com/api/delete?fileName={fileName}
```

## Assumptions

- No Database used to store Metadata of file
- No user authentication/protection - Any user will be able to upload/download any file
- If a file that is uploaded already exists, then date time will be added before the name of the document.
