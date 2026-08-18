import re

with open('src/components/MembersPage.tsx', 'r') as f:
    code = f.read()

target = """export const INITIAL_MEMBERS: MemberItem[] = [
  {
    id: 'm1',
    name: 'Ibrahim Nashidh',
    role: 'Council Quartermaster',"""

replacement = """export const INITIAL_MEMBERS: MemberItem[] = [
  {
    id: 'm1',
    name: 'Ibrahim Nashidh',
    idCard: 'A111111',
    password: '123456',
    role: 'Council Quartermaster',"""

code = code.replace(target, replacement)

target2 = """  {
    id: 'm2',
    name: 'Mariyam Shazra',
    role: 'Council Secretary',"""

replacement2 = """  {
    id: 'm2',
    name: 'Mariyam Shazra',
    idCard: 'A222222',
    password: '123456',
    role: 'Council Secretary',"""

code = code.replace(target2, replacement2)

with open('src/components/MembersPage.tsx', 'w') as f:
    f.write(code)
