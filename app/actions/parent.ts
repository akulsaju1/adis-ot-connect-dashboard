'use server'

import {
  registerParent,
  getParentByNfcCode,
  getAllParents,
  uploadStudentPhoto,
  getStudentPhoto,
  addStudentToParent,
  getChildrenByParentId,
  getChildrenAwaitingPickup,
  unlinkStudentFromParent,
  performMultiChildDismissal,
  type LocalParent,
  type StudentChild,
  type StudentPhoto,
} from '@/lib/local-db'
import { getStaffSession } from './staff-auth'

// Parent registration
export async function registerNewParent(
  nfcCode: string,
  parentName: string,
  phone?: string,
  email?: string
): Promise<LocalParent> {
  const staffSession = await getStaffSession()
  if (staffSession) {
    throw new Error('Gate staff cannot register parents. This is an admin-only function.')
  }

  try {
    const result = await registerParent(nfcCode, parentName, phone, email)
    return result
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to register parent')
  }
}

// Photo upload
export async function uploadStudentPhotoAction(
  studentId: string,
  photoData: string
): Promise<StudentPhoto> {
  try {
    const result = await uploadStudentPhoto(studentId, photoData)
    return result
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to upload photo')
  }
}

export async function fetchStudentPhoto(studentId: string): Promise<StudentPhoto | null> {
  try {
    const result = await getStudentPhoto(studentId)
    return result
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to fetch photo')
  }
}

// Child linkage
export async function linkStudentToParent(
  parentId: number,
  studentId: string,
  studentName: string,
  class_: string,
  block: string,
  nfcCode: string
): Promise<StudentChild> {
  const staffSession = await getStaffSession()
  if (staffSession) {
    throw new Error('Gate staff cannot link students. This is an admin-only function.')
  }

  try {
    const result = await addStudentToParent(
      parentId,
      studentId,
      studentName,
      class_,
      block,
      nfcCode
    )
    return result
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to link student to parent')
  }
}

// Get parent data
export async function getParentInfo(nfcCode: string) {
  try {
    const parent = await getParentByNfcCode(nfcCode)
    if (!parent) {
      return null
    }

    // Get children for this parent
    const children = await getChildrenAwaitingPickup(parent.id)
    
    // Get photos for all children
    const childrenWithPhotos = await Promise.all(
      children.map(async (child) => {
        const photo = await getStudentPhoto(child.studentId)
        return {
          ...child,
          photo: photo?.photoData || null,
        }
      })
    )

    return {
      parent,
      children: childrenWithPhotos,
    }
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to get parent info')
  }
}

// Multi-child dismissal
export async function dismissMultipleChildren(
  parentId: number,
  selectedStudentIds: string[]
): Promise<void> {
  try {
    if (selectedStudentIds.length === 0) {
      throw new Error('No students selected')
    }

    await performMultiChildDismissal(parentId, selectedStudentIds)
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to dismiss students')
  }
}

// Get all parents for admin
export async function fetchAllParents() {
  const staffSession = await getStaffSession()
  if (staffSession) {
    throw new Error('Gate staff cannot view all parents. This is an admin-only function.')
  }

  try {
    const result = await getAllParents()
    return result
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to fetch parents')
  }
}

// Get parent's children
export async function getParentChildren(parentId: number) {
  try {
    const children = await getChildrenByParentId(parentId)
    
    // Get photos for all children
    const childrenWithPhotos = await Promise.all(
      children.map(async (child) => {
        const photo = await getStudentPhoto(child.studentId)
        return {
          ...child,
          photo: photo?.photoData || null,
        }
      })
    )

    return childrenWithPhotos
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to get parent children')
  }
}

// Unlink student from parent
export async function removeStudentFromParent(
  parentId: number,
  studentId: string
): Promise<void> {
  const staffSession = await getStaffSession()
  if (staffSession) {
    throw new Error('Gate staff cannot modify parent-student links. This is an admin-only function.')
  }

  try {
    await unlinkStudentFromParent(parentId, studentId)
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to unlink student')
  }
}
