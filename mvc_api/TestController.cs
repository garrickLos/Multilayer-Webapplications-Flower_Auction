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
    public Student GetStudent()
    {
        var student = new Student { Id = 1, Studentnummer = 25012345L, Naam = "Jelle" };
        return student;
    }

    // GET: api/Student/studentmetstatus
    [HttpGet("studentmetstatus")]
    public ActionResult<Student> GetStudentMetStatus()
    {
        var student = new Student { Id = 1, Studentnummer = 25012345L, Naam = "Jelle" };
        if (student.Naam == "Jelle")
            return NotFound(); // laat zien hoe NotFound() werkt
        return student;
    }

    // GET: api/Student/{id}
    [HttpGet("{id:int}")]
    public ActionResult<Student> GetStudentById(int id)
    {
        var student = Student.Students.FirstOrDefault(s => s.Id == id);
        if (student is null) return NotFound();
        return student; // ActionResult<T> accepteert T of een IActionResult
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
    public long Studentnummer { get; set; } // was string; past nu bij je 25012345L
    public string Naam { get; set; }

    // simpele in-memory "database" voor demo
    public static List<Student> Students { get; } = new()
    {
        new Student { Id = 1, Studentnummer = 25012345L, Naam = "Jelle" },
        new Student { Id = 2, Studentnummer = 25054321L, Naam = "Saar" },
    };
}
