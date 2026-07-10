import pymysql

connection = pymysql.connect(
    host='localhost',
    user='root',
    password='P@##WORD*',
    database='ai_task_db'
)

with connection.cursor() as cursor:
    try:
        cursor.execute("ALTER TABLE tasks ADD COLUMN answer TEXT DEFAULT NULL;")
        print("Successfully added 'answer' column.")
    except Exception as e:
        print(f"Error: {e}")

connection.commit()
connection.close()
