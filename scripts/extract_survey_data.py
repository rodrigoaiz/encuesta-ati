#!/usr/bin/env python3
"""Extracts aggregated survey results from the Google Forms Excel export."""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

GRADE_FIELD = 'Grado del alumno'
Q1_FIELD = '¿Te gustaría que se realice en los siguientes ciclos escolares?'
Q2_FIELD = '¿Consideras que el temario está de acuerdo con las necesidades los niñ@s?'
ORDERED_GRADES = ['Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto', 'Sexto']


def col_number(label: str) -> int:
    value = 0
    for char in label:
        value = value * 26 + (ord(char) - 64)
    return value


def load_sheet_rows(xlsx_path: Path) -> list[dict[str, str]]:
    with zipfile.ZipFile(xlsx_path) as archive:
        shared_strings: list[str] = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            shared_root = ET.fromstring(archive.read('xl/sharedStrings.xml'))
            ns = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for item in shared_root.findall('x:si', ns):
                shared_strings.append(''.join(t.text or '' for t in item.findall('.//x:t', ns)))

        sheet_root = ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
        ns = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        rows: list[dict[str, str]] = []

        for row in sheet_root.findall('.//x:sheetData/x:row', ns):
            parsed: dict[str, str] = {}
            for cell in row.findall('x:c', ns):
                ref = cell.attrib.get('r', '')
                col = ''.join(ch for ch in ref if ch.isalpha())
                cell_type = cell.attrib.get('t')
                value_tag = cell.find('x:v', ns)
                inline_tag = cell.find('x:is', ns)
                value = ''

                if cell_type == 's' and value_tag is not None and value_tag.text:
                    value = shared_strings[int(value_tag.text)]
                elif cell_type == 'inlineStr' and inline_tag is not None:
                    text_tag = inline_tag.find('x:t', ns)
                    value = text_tag.text if text_tag is not None and text_tag.text else ''
                elif value_tag is not None and value_tag.text:
                    value = value_tag.text

                parsed[col] = value.strip()
            rows.append(parsed)

        return rows


def normalize_grades(raw_grade: str) -> list[str]:
    grades = [g.strip().title() for g in re.split(r'[,;/]+', raw_grade) if g.strip()]
    unique: list[str] = []
    for grade in grades:
        if grade not in unique:
            unique.append(grade)
    return unique


def yes_no(counter: Counter[str]) -> dict[str, int]:
    return {'Si': int(counter.get('Si', 0)), 'No': int(counter.get('No', 0))}


def transform(rows: list[dict[str, str]], source_name: str) -> dict:
    if not rows:
        raise ValueError('The sheet has no rows.')

    header = rows[0]
    cols = sorted(header.keys(), key=col_number)
    name_to_col = {header[col]: col for col in cols}

    grade_counter: Counter[str] = Counter()
    overall = {Q1_FIELD: Counter(), Q2_FIELD: Counter()}
    by_grade = defaultdict(lambda: {'responses': 0, Q1_FIELD: Counter(), Q2_FIELD: Counter()})

    valid_responses = 0
    for row in rows[1:]:
        grade_raw = row.get(name_to_col.get(GRADE_FIELD, ''), '').strip()
        answer_1 = row.get(name_to_col.get(Q1_FIELD, ''), '').strip()
        answer_2 = row.get(name_to_col.get(Q2_FIELD, ''), '').strip()

        if not grade_raw or not (answer_1 or answer_2):
            continue

        grades = normalize_grades(grade_raw)
        if not grades:
            continue

        valid_responses += 1

        if answer_1:
            overall[Q1_FIELD][answer_1] += 1
        if answer_2:
            overall[Q2_FIELD][answer_2] += 1

        for grade in grades:
            grade_counter[grade] += 1
            by_grade[grade]['responses'] += 1
            if answer_1:
                by_grade[grade][Q1_FIELD][answer_1] += 1
            if answer_2:
                by_grade[grade][Q2_FIELD][answer_2] += 1

    ordered = sorted(
        by_grade.keys(),
        key=lambda grade: ORDERED_GRADES.index(grade) if grade in ORDERED_GRADES else 99,
    )

    payload = {
        'meta': {
            'sourceFile': source_name,
            'validResponses': valid_responses,
            'note': (
                'Se excluyen comentarios y marca temporal. '
                'Algunas respuestas incluyen varios grados y se contabilizan en cada grado indicado.'
            ),
        },
        'questions': [Q1_FIELD, Q2_FIELD],
        'overall': {
            'responses': valid_responses,
            'gradesDistribution': [
                {'name': grade, 'value': grade_counter[grade]}
                for grade in sorted(
                    grade_counter.keys(),
                    key=lambda g: ORDERED_GRADES.index(g) if g in ORDERED_GRADES else 99,
                )
            ],
            'answers': {
                Q1_FIELD: yes_no(overall[Q1_FIELD]),
                Q2_FIELD: yes_no(overall[Q2_FIELD]),
            },
        },
        'byGrade': {
            grade: {
                'responses': int(by_grade[grade]['responses']),
                'answers': {
                    Q1_FIELD: yes_no(by_grade[grade][Q1_FIELD]),
                    Q2_FIELD: yes_no(by_grade[grade][Q2_FIELD]),
                },
            }
            for grade in ordered
        },
    }

    return payload


def main() -> int:
    source = Path(sys.argv[1] if len(sys.argv) > 1 else 'Formulario sin título (Respuestas).xlsx')
    target = Path(sys.argv[2] if len(sys.argv) > 2 else 'src/data/survey-data.json')

    rows = load_sheet_rows(source)
    payload = transform(rows, source.name)

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')

    print(f'Generated: {target}')
    print(f"Valid responses: {payload['meta']['validResponses']}")
    print(f"Grades: {', '.join(payload['byGrade'].keys())}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
