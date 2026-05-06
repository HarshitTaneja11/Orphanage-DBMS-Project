from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', 'April@2005'),
        database=os.getenv('DB_NAME', 'orphanage_db')
    )

@app.route('/api/dashboard/stats', methods=['GET'])
def get_stats():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('SELECT COUNT(*) as count FROM Children')
        children_count = cursor.fetchone()['count']
        
        cursor.execute('SELECT SUM(Amount) as total FROM Donation')
        donations_total = cursor.fetchone()['total']
        
        cursor.execute('SELECT SUM(Total_Quantity) as total FROM Resource')
        resources_total = cursor.fetchone()['total']
        
        cursor.execute('SELECT COUNT(*) as count FROM Allocation WHERE Allocation_Date = CURDATE()')
        allocations_today = cursor.fetchone()['count']
        
        return jsonify({
            'totalChildren': children_count or 0,
            'totalDonations': float(donations_total or 0),
            'resourcesAvailable': int(resources_total or 0),
            'allocationsToday': allocations_today or 0
        })
    except Exception as e:
        print("Error fetching stats:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/donations/recent', methods=['GET'])
def get_recent_donations():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT d.Name as donor, do.Amount as amount, DATE_FORMAT(do.Donation_Date, '%Y-%m-%d') as date, 'Completed' as status 
            FROM Donation do 
            JOIN Donor d ON do.Donor_ID = d.Donor_ID 
            ORDER BY do.Donation_Date DESC 
            LIMIT 5
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        for row in rows:
            row['amount'] = float(row['amount'])
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/resources/low', methods=['GET'])
def get_low_resources():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT Resource_ID as id, Resource_Type as type, Total_Quantity as qty FROM Resource WHERE Total_Quantity < 100')
        rows = cursor.fetchall()
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/children', methods=['GET'])
def get_children():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT Child_ID as id, Name as name, DATE_FORMAT(DOB, "%Y-%m-%d") as dob, Gender as gender, Medical_Record as medical FROM Children')
        rows = cursor.fetchall()
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/resources', methods=['GET'])
def get_resources():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT Resource_ID as id, Resource_Type as type, Total_Quantity as qty FROM Resource')
        rows = cursor.fetchall()
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/staff', methods=['GET'])
def get_staff():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT Staff_ID as id, Name as name, Role as role, Contact as contact FROM Staff')
        rows = cursor.fetchall()
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/donors', methods=['GET'])
def get_donors():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT Donor_ID as id, Name as name, Contact as contact, Email as email FROM Donor')
        rows = cursor.fetchall()
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/donations', methods=['GET'])
def get_donations():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT do.Donation_ID as id, d.Name as donor, do.Amount as amount, DATE_FORMAT(do.Donation_Date, '%Y-%m-%d') as date 
            FROM Donation do 
            JOIN Donor d ON do.Donor_ID = d.Donor_ID 
            ORDER BY do.Donation_Date DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        for row in rows:
            row['amount'] = float(row['amount'])
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/allocations', methods=['GET'])
def get_allocations():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT a.Allocation_ID as id, a.Child_ID as child_id, a.Resource_ID as resource_id, a.Staff_ID as staff_id, c.Name as child, r.Resource_Type as resource, a.Quantity as qty, DATE_FORMAT(a.Allocation_Date, '%Y-%m-%d') as date, s.Name as staff 
            FROM Allocation a 
            JOIN Children c ON a.Child_ID = c.Child_ID 
            JOIN Resource r ON a.Resource_ID = r.Resource_ID
            JOIN Staff s ON a.Staff_ID = s.Staff_ID
            ORDER BY a.Allocation_Date DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/children', methods=['POST'])
def add_child():
    data = request.json
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO Children (Name, DOB, Gender, Medical_Record) VALUES (%s, %s, %s, %s)',
                       (data['name'], data['dob'], data['gender'], data.get('medical', '')))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/resources', methods=['POST'])
def add_resource():
    data = request.json
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO Resource (Resource_Type, Total_Quantity) VALUES (%s, %s)',
                       (data['type'], data['qty']))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/staff', methods=['POST'])
def add_staff():
    data = request.json
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO Staff (Name, Role, Contact) VALUES (%s, %s, %s)',
                       (data['name'], data['role'], data['contact']))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/donors', methods=['POST'])
def add_donor():
    data = request.json
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO Donor (Name, Contact, Email) VALUES (%s, %s, %s)',
                       (data['name'], data['contact'], data.get('email', '')))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/donations', methods=['POST'])
def record_donation():
    data = request.json
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO Donation (Donor_ID, Amount, Donation_Date) VALUES (%s, %s, %s)',
                       (data['donor_id'], data['amount'], data['date']))
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/allocations', methods=['POST'])
def add_allocation():
    data = request.json
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('CALL AllocateResource(%s, %s, %s, %s)',
                       (data['child_id'], data['resource_id'], data['qty'], data['staff_id']))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/children/<int:id>', methods=['PUT', 'DELETE'])
def manage_child(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if request.method == 'PUT':
            data = request.json
            cursor.execute('UPDATE Children SET Name=%s, DOB=%s, Gender=%s, Medical_Record=%s WHERE Child_ID=%s',
                           (data['name'], data['dob'], data['gender'], data.get('medical', ''), id))
            conn.commit()
            return jsonify({'success': True})
        elif request.method == 'DELETE':
            cursor.execute('DELETE FROM Children WHERE Child_ID=%s', (id,))
            conn.commit()
            return jsonify({'success': True})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/resources/<int:id>', methods=['PUT', 'DELETE'])
def manage_resource(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if request.method == 'PUT':
            data = request.json
            cursor.execute('UPDATE Resource SET Resource_Type=%s, Total_Quantity=%s WHERE Resource_ID=%s',
                           (data['type'], data['qty'], id))
            conn.commit()
            return jsonify({'success': True})
        elif request.method == 'DELETE':
            cursor.execute('DELETE FROM Resource WHERE Resource_ID=%s', (id,))
            conn.commit()
            return jsonify({'success': True})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/staff/<int:id>', methods=['PUT', 'DELETE'])
def manage_staff(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if request.method == 'PUT':
            data = request.json
            cursor.execute('UPDATE Staff SET Name=%s, Role=%s, Contact=%s WHERE Staff_ID=%s',
                           (data['name'], data['role'], data['contact'], id))
            conn.commit()
            return jsonify({'success': True})
        elif request.method == 'DELETE':
            cursor.execute('DELETE FROM Staff WHERE Staff_ID=%s', (id,))
            conn.commit()
            return jsonify({'success': True})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/donors/<int:id>', methods=['PUT', 'DELETE'])
def manage_donor(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if request.method == 'PUT':
            data = request.json
            cursor.execute('UPDATE Donor SET Name=%s, Contact=%s, Email=%s WHERE Donor_ID=%s',
                           (data['name'], data['contact'], data.get('email', ''), id))
            conn.commit()
            return jsonify({'success': True})
        elif request.method == 'DELETE':
            cursor.execute('DELETE FROM Donor WHERE Donor_ID=%s', (id,))
            conn.commit()
            return jsonify({'success': True})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/allocations/<int:id>', methods=['PUT', 'DELETE'])
def manage_allocation(id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if request.method == 'PUT':
            data = request.json
            cursor.execute('UPDATE Allocation SET Child_ID=%s, Resource_ID=%s, Quantity=%s, Staff_ID=%s WHERE Allocation_ID=%s',
                           (data['child_id'], data['resource_id'], data['qty'], data['staff_id'], id))
            conn.commit()
            return jsonify({'success': True})
        elif request.method == 'DELETE':
            cursor.execute('DELETE FROM Allocation WHERE Allocation_ID=%s', (id,))
            conn.commit()
            return jsonify({'success': True})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    print("Backend server running at http://localhost:3000")
    app.run(port=3000, debug=True)
