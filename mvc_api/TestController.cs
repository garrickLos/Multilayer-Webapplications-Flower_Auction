using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[Route("api/[controller]")]
[ApiController]
public class StudentController : ControllerBase
{
    // GET: api/Student
    [HttpGet]
    public string GetString() => "Het endpoint werkt!";

    // GET: api/Student/student
    [HttpGet("student")]
    public ActionResult<Student> GetStudent()
    {
        // Geef gewoon de eerste student terug
        var student = Student.Students.FirstOrDefault();
        if (student is null) return NotFound();
        return student;
    }

    // GET: api/Student/studentmetstatus
    [HttpGet("studentmetstatus")]
    public ActionResult<Student> GetStudentMetStatus()
    {
        // Zelfde idee, maar je kan hier bijv. de tweede student pakken
        var student = Student.Students.Skip(1).FirstOrDefault();
        if (student is null) return NotFound();
        return student;
    }

    // GET: api/Student/{id}
    [HttpGet("{id:int}")]
    public ActionResult<Student> GetStudentById(int id)
    {
        var student = Student.Students.FirstOrDefault(s => s.Id == id);
        if (student is null) return NotFound();
        return student;
    }

    // GET: api/Student/async/{id}
    [HttpGet("async/{id:int}")]
    public Task<ActionResult<Student>> GetStudentByIdAsync(int id)
    {
        var student = Student.Students.FirstOrDefault(s => s.Id == id);
        if (student is null)
            return Task.FromResult<ActionResult<Student>>(NotFound());

        return Task.FromResult<ActionResult<Student>>(student);
    }
}

public class Student
{
    public int Id { get; set; }
    public long Studentnummer { get; set; }
    public string Naam { get; set; }

    public static List<Student> Students { get; } = new()
    {
        new Student { Id = 1, Studentnummer = 25012345L, Naam = "Jelle" },
        new Student { Id = 2, Studentnummer = 25054321L, Naam = "Saar" },
    };
}