
USE orphanage_db;

CREATE TABLE Children (
    Child_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(50) NOT NULL,
    DOB DATE NOT NULL,
    Gender ENUM('Male','Female','Other'),
    Medical_Record VARCHAR(255),
    Education_Details VARCHAR(255)
);

CREATE TABLE Staff (
    Staff_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(50) NOT NULL,
    Role VARCHAR(30) NOT NULL,
    Contact VARCHAR(15) UNIQUE
);

CREATE TABLE Donor (
    Donor_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(50) NOT NULL,
    Contact VARCHAR(15),
    Email VARCHAR(100) UNIQUE
);

CREATE TABLE Donation (
    Donation_ID INT PRIMARY KEY AUTO_INCREMENT,
    Donor_ID INT,
    Amount DECIMAL(10,2) NOT NULL CHECK (Amount > 0),
    Donation_Date DATE NOT NULL,
    FOREIGN KEY (Donor_ID) REFERENCES Donor(Donor_ID)
);

CREATE TABLE Resource (
    Resource_ID INT PRIMARY KEY AUTO_INCREMENT,
    Resource_Type VARCHAR(50) NOT NULL,
    Total_Quantity INT NOT NULL CHECK (Total_Quantity >= 0)
);

CREATE TABLE Allocation (
    Allocation_ID INT PRIMARY KEY AUTO_INCREMENT,
    Child_ID INT,
    Resource_ID INT,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    Allocation_Date DATE NOT NULL,
    Staff_ID INT,
    FOREIGN KEY (Child_ID) REFERENCES Children(Child_ID),
    FOREIGN KEY (Resource_ID) REFERENCES Resource(Resource_ID),
    FOREIGN KEY (Staff_ID) REFERENCES Staff(Staff_ID)
);

CREATE TABLE Audit_Log (
    Log_ID INT PRIMARY KEY AUTO_INCREMENT,
    Action_Type VARCHAR(50),
    Table_Name VARCHAR(50),
    Action_Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Description VARCHAR(255)
);

INSERT INTO Children (Name, DOB, Gender, Medical_Record, Education_Details) VALUES
('Aarav Sharma', '2012-03-14', 'Male', 'Mild Asthma', 'Class 6'),
('Ananya Verma', '2011-08-22', 'Female', 'No major medical history', 'Class 7'),
('Rohan Mehta', '2013-01-10', 'Male', 'Type 1 Diabetes', 'Class 5'),
('Priya Nair', '2010-11-05', 'Female', 'Iron deficiency anemia', 'Class 8'),
('Kabir Singh', '2012-06-18', 'Male', 'No major medical history', 'Class 6'),
('Meera Iyer', '2011-04-27', 'Female', 'Seasonal allergies', 'Class 7'),
('Arjun Patel', '2013-09-12', 'Male', 'No major medical history', 'Class 5'),
('Diya Kapoor', '2010-12-30', 'Female', 'Mild vision impairment', 'Class 8');

INSERT INTO Staff (Name, Role, Contact) VALUES
('Rajesh Kumar', 'Manager', '9817012345'),
('Sunita Sharma', 'Caretaker', '9817012346'),
('Vikram Singh', 'Coordinator', '9817012347'),
('Neha Joshi', 'Medical Supervisor', '9817012348');

INSERT INTO Donor (Name, Contact, Email) VALUES
('Smile Foundation', '9876500001', 'donations@smilefoundation.org'),
('Goonj', '9876500002', 'support@goonj.org'),
('Akshaya Patra Foundation', '9876500003', 'help@akshayapatra.org'),
('Seva Trust Patiala', '9876500004', 'contact@sevatrust.in'),
('Anonymous Benefactor', '9876500005', 'anonymous@donor.in');

INSERT INTO Donation (Donor_ID, Amount, Donation_Date) VALUES
(1, 75000.00, '2026-03-15'),
(2, 40000.00, '2026-03-28'),
(3, 100000.00, '2026-04-05'),
(4, 25000.00, '2026-04-18'),
(5, 15000.00, '2026-04-25');

INSERT INTO Resource (Resource_Type, Total_Quantity) VALUES
('Food Ration Kits', 150),
('School Uniform Sets', 80),
('Textbooks & Stationery', 120),
('Medical Aid Kits', 50),
('Winter Blankets', 70),
('Hygiene Kits', 100);

DELIMITER //

CREATE TRIGGER trg_after_allocation
AFTER INSERT ON Allocation
FOR EACH ROW
BEGIN
    -- reduce stock
    UPDATE Resource
    SET Total_Quantity = Total_Quantity - NEW.Quantity
    WHERE Resource_ID = NEW.Resource_ID;

    -- log activity
    INSERT INTO Audit_Log(Action_Type, Table_Name, Description)
    VALUES(
        'INSERT',
        'Allocation',
        CONCAT(
            'Allocated ',
            NEW.Quantity,
            ' units of Resource_ID ',
            NEW.Resource_ID,
            ' to Child_ID ',
            NEW.Child_ID
        )
    );
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE AllocateResource(
    IN p_child_id INT,
    IN p_resource_id INT,
    IN p_quantity INT,
    IN p_staff_id INT
)
BEGIN
    INSERT INTO Allocation (
        Child_ID,
        Resource_ID,
        Quantity,
        Allocation_Date,
        Staff_ID
    )
    VALUES (
        p_child_id,
        p_resource_id,
        p_quantity,
        CURDATE(),
        p_staff_id
    );
END//

DELIMITER ;

CALL AllocateResource(1, 1, 5, 1);

DELIMITER //

CREATE FUNCTION TotalDonations()
RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
    DECLARE total DECIMAL(12,2);

    SELECT SUM(Amount)
    INTO total
    FROM Donation;

    RETURN total;
END//

DELIMITER ;

CREATE VIEW Allocation_Report AS
SELECT
    a.Allocation_ID,
    c.Name AS Child_Name,
    r.Resource_Type,
    a.Quantity,
    s.Name AS Allocated_By,
    a.Allocation_Date
FROM Allocation a
JOIN Children c ON a.Child_ID = c.Child_ID
JOIN Resource r ON a.Resource_ID = r.Resource_ID
JOIN Staff s ON a.Staff_ID = s.Staff_ID;

SELECT
    d.Name,
    SUM(do.Amount) AS Total_Donated
FROM Donor d
JOIN Donation do ON d.Donor_ID = do.Donor_ID
GROUP BY d.Name
ORDER BY Total_Donated DESC;

SELECT *
FROM Resource
WHERE Total_Quantity < 100;

SELECT Child_ID, SUM(Quantity) AS Total_Received
FROM Allocation
GROUP BY Child_ID
HAVING SUM(Quantity) >
(
    SELECT AVG(Quantity)
    FROM Allocation
);

SELECT
    s.Name,
    COUNT(a.Allocation_ID) AS Allocations_Made
FROM Staff s
LEFT JOIN Allocation a ON s.Staff_ID = a.Staff_ID
GROUP BY s.Name;

START TRANSACTION;

INSERT INTO Donation(Donor_ID, Amount, Donation_Date)
VALUES(2, 5000, CURDATE());

ROLLBACK;

SELECT * FROM Donation;


CREATE ROLE 'admin_role';
CREATE ROLE 'staff_role';
CREATE ROLE 'auditor_role';

GRANT ALL PRIVILEGES ON orphanage_db.* TO 'admin_role';

GRANT SELECT, INSERT, UPDATE ON orphanage_db.Children TO 'staff_role';
GRANT SELECT, INSERT, UPDATE ON orphanage_db.Allocation TO 'staff_role';
GRANT SELECT ON orphanage_db.Resource TO 'staff_role';
GRANT SELECT ON orphanage_db.Donation TO 'staff_role';

GRANT SELECT ON orphanage_db.* TO 'auditor_role';

DELIMITER //

CREATE TRIGGER trg_after_donation
AFTER INSERT ON Donation
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Action_Type, Table_Name, Description)
    VALUES(
        'INSERT',
        'Donation',
        CONCAT(
            'Donation of ₹',
            NEW.Amount,
            ' received from Donor_ID ',
            NEW.Donor_ID
        )
    );
END//

DELIMITER ;


DELIMITER //

CREATE TRIGGER trg_child_update
AFTER UPDATE ON Children
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log(Action_Type, Table_Name, Description)
    VALUES(
        'UPDATE',
        'Children',
        CONCAT(
            'Updated record for Child_ID ',
            NEW.Child_ID,
            ' (',
            NEW.Name,
            ')'
        )
    );
END//

DELIMITER ;

CREATE INDEX idx_child_name ON Children(Name);
CREATE INDEX idx_resource_type ON Resource(Resource_Type);
CREATE INDEX idx_donation_date ON Donation(Donation_Date);
CREATE INDEX idx_allocation_date ON Allocation(Allocation_Date);

SHOW INDEX FROM Children;
SHOW INDEX FROM Resource;
SHOW INDEX FROM Donation;
SHOW INDEX FROM Allocation;

